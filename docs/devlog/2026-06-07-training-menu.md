# 2026-06-07 — 训练场景菜单 + 调试控制面板

> Commit：`28658e7`、`d47fa6a`（共 2 个）

## 做了什么

`28658e7` — Add Training Setup Menu v0.1 (F10 debug panel)

新增了一个 F10 调出的训练配置面板，允许在不重启游戏的情况下设置：
- 当前 Strike 数（0/1/2）
- 当前 Out 数（0/1/2）
- 垒位状态（Empty / Runner on 1B / Runner on 2B / Runners on 1B+2B）

## TrainingSetupPanel 的实现方式

整个 UI 完全用代码创建，没有 `.tscn` 场景文件：

```gdscript
# training_setup_panel.gd
func _ready() -> void:
    var margin := MarginContainer.new()
    var vbox   := VBoxContainer.new()
    _strikes_option = _add_row(vbox, "Strikes:", ["0", "1", "2"])
    _outs_option    = _add_row(vbox, "Outs:",    ["0", "1", "2"])
    _bases_option   = _add_row(vbox, "Bases:", [
        "Empty", "Runner on 1B", "Runner on 2B", "Runners on 1B + 2B",
    ])
    var apply_btn := Button.new()
    apply_btn.pressed.connect(_on_apply_pressed)
```

`_add_row()` 是内部辅助函数，创建 `Label + OptionButton` 的 `HBoxContainer`。

## 信号传递配置数据

点击 Apply 后发射带参数的信号：

```gdscript
signal setup_applied(strikes: int, outs: int, base_state: String)

func _on_apply_pressed() -> void:
    var base_state: String = _BASE_OPTIONS[_bases_option.selected]
    setup_applied.emit(_strikes_option.selected, _outs_option.selected, base_state)
    hide()
```

GameDirector 收到信号后，调用 `_apply_training_setup()` 直接覆盖当前游戏状态：

```gdscript
func _apply_training_setup(strikes: int, outs: int, base_state: String) -> void:
    _reset_current_play_only()  # 重置本球，不清 out/strike 计数
    strike_count = strikes      # 覆盖为配置值
    out_count    = outs
    _set_base_state(base_state)
```

## 菜单打开时冻结游戏逻辑

```gdscript
# game_director.gd:_process()
if _setup_menu_open:
    return   # 完全跳过所有游戏更新
```

`_setup_menu_open` 的同步通过 `visibility_changed` 信号完成，不需要手动维护：

```gdscript
_training_panel.visibility_changed.connect(_on_setup_panel_visibility_changed)

func _on_setup_panel_visibility_changed() -> void:
    _setup_menu_open = _training_panel.visible
```

## 为什么这是一个独立的 Panel 而不是 Godot 的 pause 系统？

Godot 有内置的 `get_tree().paused = true` 暂停机制，但训练菜单选择用 `if _setup_menu_open: return` 手动控制。

这种方式的好处：只暂停游戏逻辑，不影响 UI 节点的输入响应（菜单仍然可以接受点击）。

## 读完你应该能回答

- `_reset_current_play_only()` 和 `_do_reset()` 的区别是什么？（提示：前者不重置 strike/out 计数）
- 为什么用 `visibility_changed` 信号而不是直接在 `_toggle_setup_panel()` 里赋值？
- `_add_row()` 返回的是什么？为什么要把返回值存起来？

## 涉及文件（28658e7）

- `scripts/ui/training_setup_panel.gd` — 全部（67 行）
- `scripts/gameplay/game_director.gd` — `_on_training_setup_applied()`、`_apply_training_setup()`、`_set_base_state()`、`_on_setup_panel_visibility_changed()`

---

## d47fa6a — Training Menu Tabs + Debug Controls v0.1

菜单升级为双 Tab 结构，并将原来散落在键盘快捷键里的调试开关全部集中到 Debug Tab。

### 新增内容

**Setup Tab**（原有功能保留，布局略有调整）：Strikes / Outs / Bases 三个 OptionButton + Apply 按钮

**Debug Tab**：
- 6 个 CheckBox 开关：Show Debug UI `[F1]`、Show Labels `[F2]`、Show Catch Ranges `[F3]`、Show Hit Zones `[V/F4]`、Show Throw Line `[F5]`、Auto Catch `[C]`
- 2 个 Override OptionButton：Hit Type（Auto / Ground / Normal / Fly）、Direction（Auto / Right / Center / Left-Ctr / Left）

### Tab 切换的实现

没有用 Godot 内置的 `TabContainer`，而是两个 VBoxContainer + 两个 Button 手动切换可见性：

```gdscript
var _setup_container: VBoxContainer
var _debug_container: VBoxContainer

func _show_setup_tab() -> void:
    _setup_container.visible = true
    _debug_container.visible = false

func _show_debug_tab() -> void:
    _setup_container.visible = false
    _debug_container.visible = true
```

好处：完全控制布局，不受 `TabContainer` 的样式限制。

### 信号设计：一个信号 + 字符串 key

不是为每个调试开关单独定义信号，而是用一个通用信号 + `option_name` 字符串区分：

```gdscript
signal debug_option_changed(option_name: String, enabled: bool)
signal debug_override_changed(option_name: String, value: String)

func _add_checkbox(parent: VBoxContainer, label: String, option_name: String) -> CheckBox:
    var cb := CheckBox.new()
    cb.text = label
    cb.toggled.connect(func(pressed): debug_option_changed.emit(option_name, pressed))
    parent.add_child(cb)
    return cb
```

GameDirector 用 `match` 分发：

```gdscript
func _on_debug_option_changed(option_name: String, enabled: bool) -> void:
    match option_name:
        "show_debug_ui":    debug_label.visible = enabled
        "show_labels":      _apply_label_visibility()
        "show_catch_ranges": _apply_catch_range_visibility()
        "show_zones":
            if enabled: _build_zone_overlay()
            else:       _clear_zone_overlay()
        "show_throw_line":  _throw_line.visible = enabled and ...
        "auto_catch":       auto_catch = enabled
```

这种设计让 Panel 不需要知道 GameDirector 的内部细节，新增开关只需要在 `match` 里追加一个分支。

### 面板打开时同步调试状态

Debug Tab 的 CheckBox 需要反映当前游戏状态（比如 F3 已经打开），所以面板打开时调用 `sync_debug_state()`：

```gdscript
func _set_setup_panel_open(open: bool) -> void:
    _setup_menu_open = open
    _training_panel.visible = open
    if open:
        _training_panel.sync_debug_state(
            _show_debug_ui, _show_labels, _show_catch_ranges,
            _show_zones, _show_throw_line, auto_catch,
            _force_hit_type, _force_direction
        )
```

如果不同步，用户按 F3 开了 Catch Ranges，再打开菜单，CheckBox 会显示未勾选——状态不一致。

### close_requested 替代 visibility_changed

原来用 `visibility_changed` 信号被动感知面板关闭；现在改为面板主动发射 `close_requested`：

```gdscript
# 旧做法（被动）
_training_panel.visibility_changed.connect(_on_setup_panel_visibility_changed)

# 新做法（主动）
signal close_requested

func _on_close_pressed() -> void:
    close_requested.emit()   # Panel 自己不调用 hide()
```

好处：关闭路径统一走 `_set_setup_panel_open(false)`，不会出现直接 `hide()` 跳过状态同步的情况。

## 读完你应该能回答

- `_reset_current_play_only()` 和 `_do_reset()` 的区别是什么？（提示：前者不重置 strike/out 计数）
- 为什么 Debug Tab 用一个 `debug_option_changed(option_name, enabled)` 信号而不是 6 个独立信号？
- `sync_debug_state()` 在什么时机被调用？如果不调用会出现什么问题？
- 为什么 Panel 改成发射 `close_requested` 而不是自己调用 `hide()`？

## 涉及文件（d47fa6a）

- `scripts/ui/training_setup_panel.gd` — 扩展到 ~185 行，新增 `_add_checkbox()`、`_add_override_row()`、`_show_setup_tab()`、`_show_debug_tab()`、`sync_debug_state()`
- `scripts/gameplay/game_director.gd` — 新增 `_set_setup_panel_open()`、`_on_debug_option_changed()`、`_on_debug_override_changed()`
