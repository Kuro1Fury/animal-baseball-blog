# 2026-06-07 — 训练场景菜单（F10）

> Commit：`28658e7`（共 1 个）

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

## 涉及文件

- `scripts/ui/training_setup_panel.gd` — 全部（67 行）
- `scripts/gameplay/game_director.gd` — `_on_training_setup_applied()`、`_apply_training_setup()`、`_set_base_state()`、`_on_setup_panel_visibility_changed()`
