// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod publik;

#[cfg(windows)]
extern "system" {
    fn AttachConsole(dw_process_id: u32) -> i32;
}

#[tauri::command]
fn publik_get_status(user_base_url: Option<String>, user_api_key: Option<String>) -> Result<serde_json::Value, String> {
    let user_key = match (user_base_url, user_api_key) {
        (Some(b), Some(k)) if !k.is_empty() => Some((b, k)),
        (None, Some(k)) if !k.is_empty() => Some((publik::DEFAULT_BASE_URL.into(), k)),
        _ => None,
    };
    let prov = publik::resolve_provider(user_key);
    let cred = publik::read_credential();
    let status = match prov {
        publik::Provider::Own { base_url, .. } => serde_json::json!({
            "provider": "own",
            "base_url": base_url,
            "has_key": true,
            "disclosure": publik::DISCLOSURE,
        }),
        publik::Provider::Publik { base_url, credential, .. } => {
            let claim_state = credential.as_ref()
                .and_then(|c| c["claim_state"].as_str())
                .unwrap_or("anonymous");
            let micros = credential.as_ref().and_then(|c| c["balance_micros"].as_i64());
            let line = publik::balance_line(micros, claim_state);
            serde_json::json!({
                "provider": "publik",
                "base_url": base_url,
                "has_key": true,
                "credential": credential,
                "balance_line": line,
                "claim_url": cred.as_ref().and_then(|c| c["claim_url"].as_str()),
                "add_credit_url": cred.as_ref().and_then(|c| c["add_credit_url"].as_str()),
                "cost_sentence": cred.as_ref().and_then(|c| c["cost_sentence"].as_str()),
                "disclosure": publik::DISCLOSURE,
            })
        },
        publik::Provider::NeedsConsent => serde_json::json!({
            "provider": "needs_consent",
            "base_url": publik::DEFAULT_BASE_URL,
            "has_key": false,
            "disclosure": publik::DISCLOSURE,
        }),
    };
    Ok(status)
}

#[tauri::command]
fn publik_provision() -> Result<serde_json::Value, String> {
    publik::provision(env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
fn publik_chat_completion(
    messages: Vec<serde_json::Value>,
    user_base_url: Option<String>,
    user_api_key: Option<String>,
    model: Option<String>,
    temperature: Option<f64>,
    max_tokens: Option<u64>,
) -> Result<serde_json::Value, serde_json::Value> {
    let user_key = match (user_base_url, user_api_key) {
        (Some(b), Some(k)) if !k.is_empty() => Some((b, k)),
        (None, Some(k)) if !k.is_empty() => Some((publik::DEFAULT_BASE_URL.into(), k)),
        _ => None,
    };
    publik::chat_completion(
        &messages,
        user_key,
        model.as_deref(),
        temperature,
        max_tokens,
    )
    .map_err(|(msg, top_up_url)| {
        serde_json::json!({
            "error": {
                "message": msg,
                "top_up_url": top_up_url,
            }
        })
    })
}

fn main() {
    if std::env::var_os("PUBLIK_SELF_TEST").is_some() {
        #[cfg(windows)]
        unsafe {
            AttachConsole(0xFFFFFFFF);
        }
        println!("{}", publik::self_test(env!("CARGO_PKG_VERSION")));
        return;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            publik_get_status,
            publik_provision,
            publik_chat_completion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
