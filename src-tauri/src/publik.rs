// publik.rs — publik API as one provider option. Resolution order: the user's
// own key > PUBLIK_API_KEY / PUBLIK_API_BASE_URL env > this app's credential
// file > provision on first launch (after the user accepts DISCLOSURE) > the
// user's own key again if provisioning fails.
use serde_json::{json, Value};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

pub const APP_SLUG: &str = "biocase";
pub const DEFAULT_BASE_URL: &str = "https://publikhq.com/api/v1";
/// Ask for a tier, never a vendor model name.
pub const MODELS: [&str; 3] = ["publik-fast", "publik-balanced", "publik-smart"];
/// Show this and get a yes BEFORE provision().
pub const DISCLOSURE: &str = "This app can use publik API for its AI features: no key to paste, priced per use in dollars from a publik balance that starts at $0.00. Linking this computer to a publik account gives $0.05 of free use, once. Your prompts go through publik's servers to the model; you can switch to your own key at any time.";
// Public by design: it can only mint capped keys attributed to this app, and
// every user who builds from source needs it, so it lives in the repo.
const APP_TOKEN: &str = match option_env!("PUBLIK_APP_TOKEN") {
    Some(t) => t,
    None => include_str!("../publik-app-token.txt"),
};

pub enum Provider {
    Own { base_url: String, api_key: String },
    Publik { base_url: String, api_key: String, credential: Option<Value> },
    NeedsConsent,
}

/// ~/Library/Application Support/publik/apps/<slug>.json, %LOCALAPPDATA%\publik\apps\<slug>.json, ~/.config/publik/apps/<slug>.json
pub fn credential_path() -> PathBuf {
    let home = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")).map(PathBuf::from).unwrap_or_default();
    let base = if cfg!(target_os = "macos") {
        home.join("Library/Application Support")
    } else if cfg!(windows) {
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or(home.join("AppData/Local"))
    } else {
        std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from).unwrap_or(home.join(".config"))
    };
    base.join("publik").join("apps").join(format!("{APP_SLUG}.json"))
}

pub fn read_credential() -> Option<Value> {
    let v: Value = serde_json::from_str(&std::fs::read_to_string(credential_path()).ok()?).ok()?;
    v["key"].as_str().filter(|k| k.starts_with("pk_"))?;
    Some(v)
}

fn write_credential(v: &Value) -> Result<(), String> {
    let path = credential_path();
    std::fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    std::fs::write(&path, serde_json::to_string_pretty(v).unwrap()).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

pub fn resolve_provider(user_key: Option<(String, String)>) -> Provider {
    if let Some((base_url, api_key)) = user_key.filter(|(_, k)| !k.is_empty()) {
        return Provider::Own { base_url, api_key };
    }
    if let Ok(key) = std::env::var("PUBLIK_API_KEY") {
        let base_url = std::env::var("PUBLIK_API_BASE_URL").unwrap_or_else(|_| DEFAULT_BASE_URL.into());
        return Provider::Publik { base_url, api_key: key, credential: None };
    }
    match read_credential() {
        Some(c) => Provider::Publik {
            base_url: c["base_url"].as_str().unwrap_or(DEFAULT_BASE_URL).into(),
            api_key: c["key"].as_str().unwrap_or_default().into(),
            credential: Some(c),
        },
        None => Provider::NeedsConsent,
    }
}

/// POST JSON through curl; the status code arrives on the trailing line.
fn post_json(url: &str, body: &Value) -> Result<(u16, Value), String> {
    let mut child = Command::new("curl")
        .args(["-sS", "-m", "20", "-X", "POST", url, "-H", "content-type: application/json", "--data-binary", "@-", "-w", "\n%{http_code}"])
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null())
        .spawn().map_err(|e| format!("curl: {e}"))?;
    child.stdin.take().unwrap().write_all(body.to_string().as_bytes()).map_err(|e| e.to_string())?;
    let out = String::from_utf8_lossy(&child.wait_with_output().map_err(|e| e.to_string())?.stdout).to_string();
    let (payload, code) = out.rsplit_once('\n').unwrap_or(("", &out));
    let code: u16 = code.trim().parse().unwrap_or(0);
    if code == 0 { return Err("publik API is unreachable right now. Use your own key for now.".into()); }
    Ok((code, serde_json::from_str(payload).unwrap_or(json!({}))))
}

/// Call only after the user accepted DISCLOSURE. Err is a readable message; offer the user's own key then.
pub fn provision(app_version: &str) -> Result<Value, String> {
    let runtime = std::env::var("PUBLIK_APP_TOKEN").unwrap_or_default();
    let token = if runtime.trim().is_empty() { APP_TOKEN.trim() } else { runtime.trim() };
    if !token.starts_with("pat_") { return Err("This build has no publik API app token. Use your own key for now.".into()); }
    let mut prior = read_credential().unwrap_or(json!({}));
    let mut install_id = prior["install_id"].as_str().map(String::from).unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let os = if cfg!(target_os = "macos") { "macos" } else if cfg!(windows) { "windows" } else { "linux" };
    for _ in 0..2 {
        let (code, res) = post_json(&format!("{DEFAULT_BASE_URL}/installs"), &json!({
            "app_token": token, "app_slug": APP_SLUG, "app_version": app_version, "os": os,
            "arch": std::env::consts::ARCH, "install_id": install_id, "disclosure_version": 1,
            "dialects": ["chat_completions"],
        }))?;
        let key = res["key"].as_str().or(if code == 200 { prior["key"].as_str() } else { None }).map(String::from);
        if let (200 | 201, Some(key)) = (code, key) {
            let c = json!({
                "key": key, "base_url": res["base_url"].as_str().unwrap_or(DEFAULT_BASE_URL),
                "install_id": res["install_id"].as_str().unwrap_or(&install_id), "claim_url": res["claim_url"],
                "claim_state": res["claim_state"].as_str().unwrap_or("anonymous"),
                "add_credit_url": res["wallet"]["add_credit_url"], "cost_sentence": res["disclosure"]["cost"],
                "balance_micros": res["balance_micros"],
            });
            write_credential(&c)?; // the key reaches disk before anything else sees it
            return Ok(c);
        }
        if code == 200 || res["error"]["type"] == "install_revoked" {
            install_id = uuid::Uuid::new_v4().to_string();
            prior = json!({});
            continue;
        }
        return Err(res["error"]["message"].as_str().map(String::from)
            .unwrap_or_else(|| format!("publik API could not set up this computer ({code}). Use your own key for now.")));
    }
    Err("publik API could not set up this computer. Use your own key for now.".into())
}

/// Builder check, run by the BUILT app: start it with PUBLIK_SELF_TEST=1, print this line, exit.
/// It provisions for real; the builder who runs it is the consent.
pub fn self_test(app_version: &str) -> String {
    match provision(app_version) {
        Ok(c) => format!("publik self-test: ok {APP_SLUG} {app_version} (install {:.8})", c["install_id"].as_str().unwrap_or("")),
        Err(e) => format!("publik self-test: failed: {e}"),
    }
}

/// First-run card, line 1. Then keep it live from the x-publik-balance header. A new install is $0.00 until it is linked.
pub fn balance_line(micros: Option<i64>, claim_state: &str) -> String {
    let Some(m) = micros else { return String::new() };
    let dollars = format!("${:.2}", m as f64 / 1_000_000.0);
    if m == 0 && claim_state == "anonymous" { format!("{dollars} · link this computer for $0.05 of free use") } else { format!("{dollars} of publik balance") }
}

/// A 402 renders its message plus exactly ONE link: this one.
pub fn top_up_url_from_402(body: &Value) -> (String, Option<String>) {
    let e = &body["error"];
    (e["message"].as_str().unwrap_or("Not enough publik API balance.").into(), e["top_up_url"].as_str().map(String::from))
}

/// `POST /search`: web results for `q` (quote a phrase to find it exactly), one published price per search; Err = (message, top_up_url) from a 402 or a readable failure. The key rides a curl config on stdin, never argv.
#[allow(dead_code)]
pub fn search(base_url: &str, api_key: &str, q: &str, count: u8) -> Result<Vec<Value>, (String, Option<String>)> {
    let mut child = Command::new("curl").args(["-sS", "-m", "30", "-K", "-", "-X", "POST", &format!("{base_url}/search"), "-H", "content-type: application/json", "--data-raw", &json!({"q": q, "count": count}).to_string(), "-w", "\n%{http_code}"])
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null()).spawn().map_err(|e| (format!("curl: {e}"), None))?;
    child.stdin.take().unwrap().write_all(format!("header = \"Authorization: Bearer {api_key}\"\n").as_bytes()).map_err(|e| (e.to_string(), None))?;
    let out = String::from_utf8_lossy(&child.wait_with_output().map_err(|e| (e.to_string(), None))?.stdout).to_string();
    let (payload, code) = out.rsplit_once('\n').unwrap_or(("", &out));
    let v: Value = serde_json::from_str(payload).unwrap_or(json!({}));
    match code.trim().parse::<u16>().unwrap_or(0) { 200 => Ok(v["results"].as_array().cloned().unwrap_or_default()), 402 => Err(top_up_url_from_402(&v)), c => Err((format!("publik API answered {c}."), None)) }
}

/// Execute a chat completion call. Resolves provider, constructs request, and sends via curl with key on stdin.
pub fn chat_completion(
    messages: &[Value],
    user_key: Option<(String, String)>,
    model: Option<&str>,
    temperature: Option<f64>,
    max_tokens: Option<u64>,
) -> Result<Value, (String, Option<String>)> {
    let provider = resolve_provider(user_key);
    let (base_url, api_key) = match provider {
        Provider::Own { base_url, api_key } => (base_url, api_key),
        Provider::Publik { base_url, api_key, .. } => (base_url, api_key),
        Provider::NeedsConsent => return Err(("Please accept publik terms or configure your own API key.".into(), None)),
    };

    let model_name = model.unwrap_or(MODELS[0]); // default to publik-fast
    let temp = temperature.unwrap_or(0.7);
    let tokens = max_tokens.unwrap_or(1024);

    let body = json!({
        "model": model_name,
        "messages": messages,
        "temperature": temp,
        "max_tokens": tokens,
    });

    let mut child = Command::new("curl")
        .args([
            "-sS",
            "-m",
            "45",
            "-K",
            "-",
            "-X",
            "POST",
            &format!("{base_url}/chat/completions"),
            "-H",
            "content-type: application/json",
            "--data-raw",
            &body.to_string(),
            "-w",
            "\n%{http_code}",
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| (format!("curl: {e}"), None))?;

    child
        .stdin
        .take()
        .unwrap()
        .write_all(format!("header = \"Authorization: Bearer {api_key}\"\n").as_bytes())
        .map_err(|e| (e.to_string(), None))?;

    let out = String::from_utf8_lossy(&child.wait_with_output().map_err(|e| (e.to_string(), None))?.stdout).to_string();
    let (payload, code) = out.rsplit_once('\n').unwrap_or(("", &out));
    let code: u16 = code.trim().parse().unwrap_or(0);
    let v: Value = serde_json::from_str(payload).unwrap_or(json!({}));

    match code {
        200 => Ok(v),
        402 => Err(top_up_url_from_402(&v)),
        c => {
            let msg = v["error"]["message"].as_str().unwrap_or("API request failed");
            Err((format!("{msg} ({c})"), None))
        }
    }
}
