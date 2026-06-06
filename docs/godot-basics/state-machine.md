# 枚举状态机模式

> 状态机是游戏开发里最常用的设计模式之一。Animal Baseball 里有两个用 enum + match 实现的状态机，是学习这个模式的绝佳样本。

## 什么是状态机

状态机（State Machine）描述一个对象在有限个**状态**之间的**转换规则**。任何时刻，对象处于且仅处于一种状态；某些事件会触发状态转换。

典型场景：
- 球的物理状态（IDLE → PITCHING → HIT_FLYING → GROUND_ROLLING → DEAD）
- 游戏角色的行为状态（站立 → 行走 → 跳跃 → 攻击）
- 订单状态（已创建 → 已支付 → 发货中 → 已完成）

**对 Java 开发者的类比**：状态机就是你在业务逻辑里写的那种"根据 status 字段决定行为"的代码，只是被系统化了。

## 项目里的两个状态机

### BallController：7 个状态

```gdscript
# ball_controller.gd
enum BallState { IDLE, PITCHING, HIT_FLYING, GROUND_ROLLING, CAUGHT, THROWING, DEAD }

var state: BallState = BallState.IDLE
```

状态转换图：

```
IDLE
  │ start_pitch()
  ↓
PITCHING
  │ 球越界（plane_pos.y > 750）
  ↓
DEAD ←── HIT_FLYING ←── start_hit()
              │ height_z ≤ 3.0
              ↓
        GROUND_ROLLING
              │ speed < min_speed 或越界
              ↓
            DEAD

PITCHING / HIT_FLYING / GROUND_ROLLING
  │ catch()
  ↓
CAUGHT
  │ start_throw()
  ↓
THROWING
  │ 到达目标
  ↓
DEAD
```

### RunnerController：4 个状态

```gdscript
# runner_controller.gd
enum State { IDLE, RUNNING_TO_FIRST, SAFE, OUT }
```

```
IDLE
  │ start_run()（击球时触发）
  ↓
RUNNING_TO_FIRST
  │ 到达一垒（distance < threshold）  │ stop_runner()（出局判定）
  ↓                                    ↓
SAFE                                  OUT
```

## GDScript 实现方式：enum + match

### 第一步：定义枚举

```gdscript
enum BallState { IDLE, PITCHING, HIT_FLYING, GROUND_ROLLING, CAUGHT, THROWING, DEAD }
```

GDScript 的 enum 本质是整数常量，`BallState.IDLE == 0`，`BallState.PITCHING == 1`，以此类推。

### 第二步：`_physics_process` 里 match 分派

```gdscript
func _physics_process(delta: float) -> void:
    match state:
        BallState.PITCHING:       _tick_pitching(delta)
        BallState.HIT_FLYING:     _tick_hit_flying(delta)
        BallState.GROUND_ROLLING: _tick_ground_rolling(delta)
        BallState.THROWING:       _tick_throwing(delta)
        # IDLE、CAUGHT、DEAD：不需要每帧逻辑，不写分支即可
```

`match` 相当于 Java 的 `switch`，但更简洁：没有 `break`，默认不 fall-through。

### 第三步：状态转换函数里修改 `state`

```gdscript
func start_pitch(from: Vector2, to: Vector2) -> void:
    _pitch_from   = from
    _pitch_to     = to
    pitch_elapsed = 0.0
    state         = BallState.PITCHING   # ← 状态转换在这里

func catch() -> void:
    hit_velocity      = Vector2.ZERO
    vertical_velocity = 0.0
    state             = BallState.CAUGHT  # ← 状态转换
```

### 第四步：状态内部的转换条件

有些状态转换发生在 `_tick_*` 函数内部（条件满足时自动转换）：

```gdscript
func _tick_hit_flying(delta: float) -> void:
    # ... 物理计算 ...
    if height_z <= GROUND_BALL_HEIGHT_THRESHOLD and vertical_velocity < 0.0:
        state = BallState.GROUND_ROLLING   # 内部自动转换
```

## 状态机的核心价值

### 1. 防止非法操作

```gdscript
# game_director.gd
if Input.is_action_just_pressed("action_primary"):
    match ball.state:
        BallController.BallState.IDLE:
            ball.start_pitch(...)      # 只在 IDLE 时能投球
        BallController.BallState.PITCHING:
            if not _swung_this_pitch:
                _do_swing()            # 只在 PITCHING 时能挥棒
```

不需要一堆布尔标记（`is_pitching`、`can_swing`、`is_rolling`），状态本身就是所有条件的综合。

**对 Java 开发者的类比**：类似用 `enum Status` 替代一堆 `boolean isXxx` 字段——`Order.status == PAID` 比 `order.isPaid() && !order.isShipped()` 更清晰。

### 2. 方便调试

```gdscript
# 把枚举值转成字符串用于调试显示
var state_name := str(BallController.BallState.find_key(ball.state))
debug_label.text = "Ball: %s" % state_name
# 输出：Ball: PITCHING
```

`find_key(value)` 是 GDScript 枚举的内置方法，把整数值转回键名字符串。

## 状态机的常见变体

### 简单变体（项目使用）：enum + match + 函数分派

适合逻辑不太复杂的情况，整个状态机在一个脚本里。

### 类变体：每个状态一个类

适合状态逻辑复杂、状态间差异大的情况。每个状态实现一个接口，主类只持有当前状态对象：

```gdscript
# 更复杂游戏的状态机（Animal Baseball 未使用，但了解有益）
class_name StateMachine
var current_state: State

func transition_to(new_state: State) -> void:
    current_state.exit()
    current_state = new_state
    current_state.enter()

func _physics_process(delta):
    current_state.update(delta)
```

**对 Java 开发者的类比**：这就是 GoF 的 State 模式——把状态行为封装成类，主类委托给当前状态类。

## 设计建议

1. **优先用简单 enum + match**：只有状态逻辑非常复杂时才升级到类变体
2. **不要用布尔标记代替状态**：`is_pitching = true; is_rolling = false` 这种写法容易产生非法组合
3. **状态转换集中管理**：转换逻辑放在专门的函数里（`start_pitch()`、`catch()`），不要散落在各处直接赋值 `state = ...`
4. **明确哪些操作在哪些状态有效**：用 `match` 强制约束

## 在项目里找这些内容

- `ball_controller.gd`:9 — BallState 枚举定义
- `ball_controller.gd`:86-91 — `_physics_process` 里的 match 分派
- `ball_controller.gd`:42-84 — 状态转换函数（`start_pitch`、`start_hit`、`catch` 等）
- `runner_controller.gd`:4 — RunnerController.State 枚举
- `runner_controller.gd`:21-35 — 状态转换函数
- `game_director.gd`:191-204 — 按球的状态决定玩家操作
- `game_director.gd`:261 — `find_key()` 把状态转成调试字符串
