use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Build System Tray Menu
      let open_item = MenuItem::with_id(app, "open_main", "Open CTR", true, None::<&str>)?;
      let show_mini_item = MenuItem::with_id(app, "show_mini", "Show Pomodoro Mini", true, None::<&str>)?;
      let hide_mini_item = MenuItem::with_id(app, "hide_mini", "Hide Pomodoro Mini", true, None::<&str>)?;
      let toggle_pause_item = MenuItem::with_id(app, "toggle_pause", "Pause / Resume Focus", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, "quit", "Quit CTR", true, None::<&str>)?;

      let menu = Menu::with_items(
        app,
        &[
          &open_item,
          &show_mini_item,
          &hide_mini_item,
          &toggle_pause_item,
          &quit_item,
        ],
      )?;

      let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "open_main" => {
            if let Some(main_win) = app.get_webview_window("main") {
              let _ = main_win.unminimize();
              let _ = main_win.show();
              let _ = main_win.set_focus();
            }
          }
          "show_mini" => {
            if let Some(mini_win) = app.get_webview_window("pomodoro-mini") {
              let _ = mini_win.show();
              let _ = mini_win.set_always_on_top(true);
            }
          }
          "hide_mini" => {
            if let Some(mini_win) = app.get_webview_window("pomodoro-mini") {
              let _ = mini_win.hide();
            }
          }
          "toggle_pause" => {
            let _ = app.emit("focus:command", serde_json::json!({ "action": "TOGGLE_PAUSE" }));
          }
          "quit" => {
            app.exit(0);
          }
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            let app = tray.app_handle();
            if let Some(main_win) = app.get_webview_window("main") {
              let _ = main_win.unminimize();
              let _ = main_win.show();
              let _ = main_win.set_focus();
            }
          }
        })
        .build(app)?;

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "pomodoro-mini" {
          // Closing mini window only hides it
          let _ = window.hide();
          api.prevent_close();
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
