# 输入系统：Input Map 与事件处理

> Godot 把"按了哪个键"和"这意味着什么操作"分开处理，类似后端的"接口抽象"。

## Input Map：操作与按键解耦

Godot 的输入系统分两层：

```
物理按键（Space、W、A、S、D、KP_3）
    ↓ 映射
抽象操作（"action_primary"、"move_up"、"move_left"）
    ↓ 查询
游戏代码
```

这和后端的接口抽象一样：代码不关心具体是哪个键，只关心"这个操作有没有触发"。修改键位只需在 Input Map 里改映射，代码不用动。

Input Map 在 Godot 编辑器的 `Project → Project Settings → Input Map` 里配置，也可以通过代码动态修改。

## 三种查询方式

### 1. `is_action_just_pressed` — 刚按下（最常用）

只在**按下的那一帧**返回 `true`，之后松开或持续按住都返回 `false`：

```gdscript
# game_director.gd
if Input.is_action_just_pressed("action_primary"):
    match ball.state:
        BallController.BallState.IDLE:
            ball.start_pitch(...)
        BallController.BallState.PITCHING:
            _do_swing()
```

**对 Java 开发者的类比**：类似 HTTP 请求——请求来了处理一次，不会持续触发。

### 2. `is_action_pressed` — 持续按住

只要按键没有松开，每帧都返回 `true`：

```gdscript
# 移动类操作通常用持续检测
if Input.is_action_pressed("move_up"):
    velocity.y -= speed
```

### 3. `get_vector` — 4 方向输入合并

把 4 个方向操作合并成一个 `Vector2`（已归一化，斜向不会变快）：

```gdscript
# animal_controller.gd
var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
velocity = dir * move_speed
```

| 按键 | `dir` 值 |
|------|---------|
| 右 | `(1, 0)` |
| 左 | `(-1, 0)` |
| 上 | `(0, -1)` |
| 右上（斜向）| `(0.707, -0.707)`（已归一化）|
| 无输入 | `(0, 0)` |

`get_vector` 是处理 8 方向键盘/手柄移动的推荐方式，不要自己用 4 个 `if` 组合。

## 两种处理入口

### 在 `_process()` 里轮询

```gdscript
func _process(delta: float) -> void:
    if Input.is_action_just_pressed("action_primary"):
        _do_something()
```

适合：主游戏逻辑、需要结合游戏状态判断的操作。

### `_unhandled_key_input(event)` — 事件驱动

```gdscript
func _unhandled_key_input(event: InputEvent) -> void:
    if not (event is InputEventKey and event.pressed and not event.echo):
        return   # 只处理键盘按下事件（过滤掉长按重复触发的 echo）

    match event.keycode:
        KEY_R:  _do_reset()
        KEY_F1: _show_debug_ui = !_show_debug_ui
        KEY_F2: _show_labels   = !_show_labels
```

**`event.echo`**：长按键盘时，操作系统会重复发送按键事件（echo），游戏里通常只想响应第一次按下，所以过滤掉 `event.echo == true` 的事件。

**`_unhandled_key_input` vs `_input`**：
- `_input`：所有输入事件都会到这里，包括已经被 UI 消费的
- `_unhandled_key_input`：只有 UI 没有处理的输入才到这里（避免点了菜单按钮还触发游戏操作）

**对 Java 开发者的类比**：`_unhandled_key_input` 类似 Servlet Filter 链里的"到达最末端的 Filter"——前面的处理者（UI 节点）都不处理时，才到这里。

## 项目里的键位设计

```gdscript
# game_director.gd _unhandled_key_input
match event.keycode:
    KEY_R:              _do_reset()           # 重置
    KEY_C:              auto_catch = !auto_catch  # 切换自动接球
    KEY_1:              _force_hit_type = "high"  # 强制高飞球（调试）
    KEY_2:              _force_hit_type = "ground"
    KEY_4:              _force_direction = "first"
    KEY_V:              _toggle_zones()       # 可视化切换
    KEY_F1:             _show_debug_ui = !_show_debug_ui
    KEY_F10:            _toggle_setup_panel()

# Numpad 传球（只在持球状态响应）
if _fielder_holding_ball:
    match event.physical_keycode:
        KEY_KP_1: _do_throw_to_position("P")
        KEY_KP_3: _do_throw_to_position("1B")
        KEY_KP_4: _do_throw_to_position("2B")
```

注意 Numpad 键用的是 `event.physical_keycode` 而不是 `event.keycode`：
- `keycode`：逻辑按键码，受系统键盘布局影响
- `physical_keycode`：物理位置码，不管键盘布局，Numpad 3 永远是 `KEY_KP_3`

## InputEvent 的类型

`InputEvent` 是所有输入事件的基类，常见子类：

| 子类 | 触发条件 |
|------|----------|
| `InputEventKey` | 键盘按键 |
| `InputEventMouseButton` | 鼠标点击 |
| `InputEventMouseMotion` | 鼠标移动 |
| `InputEventJoypadButton` | 手柄按键 |

类型判断：

```gdscript
if not (event is InputEventKey and event.pressed and not event.echo):
    return
```

`is` 关键字是 GDScript 的类型检查，等同于 Java 的 `instanceof`。

## 在项目里找这些内容

- `animal_controller.gd`:67-68 — `get_vector()` 8方向移动
- `game_director.gd`:191-204 — `_process()` 里的 `is_action_just_pressed`
- `game_director.gd`:219-257 — `_unhandled_key_input()` 全部键位
