# 信号系统：Godot 的 EventBus

> 信号是 Godot 的核心解耦机制，等同于观察者模式（Observer Pattern）。

## 为什么需要信号

假设 `BallController` 需要通知 `GameDirector`"球已经落地了"。

**不用信号的做法（耦合）**：

```gdscript
# ball_controller.gd — 直接调用 GameDirector 的方法
func _tick_ground_rolling(delta):
    if hit_velocity.length() < min_ground_speed:
        state = BallState.DEAD
        get_parent().get_node("GameDirector")._on_ball_landed()  # ❌ 强依赖
```

这样 `BallController` 必须知道 `GameDirector` 的存在和路径，两者强耦合。

**用信号的做法（解耦）**：

```gdscript
# ball_controller.gd — 只管发出事件
signal ball_landed

func _tick_ground_rolling(delta):
    if hit_velocity.length() < min_ground_speed:
        state = BallState.DEAD
        ball_landed.emit()     # ✅ 只管发，不管谁在听
```

```gdscript
# game_director.gd — 自己决定要不要监听
func _ready():
    ball.ball_landed.connect(_on_ball_landed)  # 订阅

func _on_ball_landed():
    # 处理球落地逻辑
```

**对 Java 开发者的类比**：这和 Spring 的 `ApplicationEvent` + `@EventListener` 完全一样的设计，或者说是 Observer 模式的语言级支持。

## 三步使用信号

### 第一步：定义信号

在发送方的类里声明：

```gdscript
class_name BallController
extends Node2D

signal ball_reached_home   # 无参数信号
signal ball_landed
signal throw_completed
signal setup_applied(strikes: int, outs: int, base_state: String)  # 带参数
```

### 第二步：发射信号（emit）

在合适的时机调用 `.emit()`：

```gdscript
ball_reached_home.emit()              # 无参数
setup_applied.emit(0, 2, "1b")       # 带参数
```

### 第三步：连接信号（connect）

在监听方的 `_ready()` 里订阅：

```gdscript
func _ready() -> void:
    ball.ball_reached_home.connect(_on_ball_reached_home)
    ball.pitch_ended.connect(_on_pitch_ended)
    ball.ball_landed.connect(_on_ball_landed)
    ball.throw_completed.connect(_on_throw_completed)
    _runner_controller.reached_first_base.connect(_on_reached_first_base)
```

回调函数签名必须与信号参数匹配：

```gdscript
# 无参信号的回调
func _on_ball_landed() -> void:
    # 处理球落地

# 带参信号的回调
func _on_training_setup_applied(strikes: int, outs: int, base_state: String) -> void:
    _apply_training_setup(strikes, outs, base_state)
```

## Java 对比

```java
// Spring ApplicationEvent 风格
public class BallLandedEvent extends ApplicationEvent {
    public BallLandedEvent(Object source) { super(source); }
}

// 发布
applicationEventPublisher.publishEvent(new BallLandedEvent(this));

// 监听
@EventListener
public void onBallLanded(BallLandedEvent event) { ... }
```

```gdscript
# Godot 信号风格
signal ball_landed           # 定义

ball_landed.emit()           # 发布

ball.ball_landed.connect(_on_ball_landed)  # 订阅
func _on_ball_landed(): ...  # 处理
```

Godot 信号比 Spring 事件更简洁，因为信号是语言级支持，不需要事件类和发布者接口。

## 信号 vs 直接调用函数

| | 信号 | 直接调用 |
|-|------|----------|
| 耦合度 | 低（发送方不知道谁监听）| 高（发送方必须知道接收方）|
| 适合场景 | 一对多通知、跨层通信 | 紧密协作的组件 |
| 可调试性 | Godot 编辑器可以可视化信号连接 | 普通函数调用 |

**经验**：如果 A 需要通知 B"某件事发生了"，用信号。如果 A 需要从 B 获取数据，直接调用函数。

## 一个特殊情况：空的信号处理函数

项目里有一个有趣的例子：

```gdscript
# game_director.gd
func _on_ball_reached_home() -> void:
    pass  # ball crossed home plate — batting window still open
```

这个函数什么都不做，只有一个注释说明意图。保留这个连接的原因是：
1. **文档作用**：说明这个事件存在，只是当前阶段不处理
2. **未来扩展**：以后可能需要在这个时机做什么

## 断开连接（disconnect）

```gdscript
ball.ball_landed.disconnect(_on_ball_landed)
```

大多数情况下不需要手动断开，节点销毁时连接自动清理。但如果连接到了一个生命周期更短的对象，需要手动管理。

## 在项目里找这些内容

- `ball_controller.gd`:4-7 — 4 个信号定义
- `runner_controller.gd`:6 — `reached_first_base` 信号定义
- `training_setup_panel.gd`:3 — 带参数的信号定义
- `game_director.gd`:74-79 — `_ready()` 里的信号连接（最集中的示例）
- `game_director.gd`:853-983 — 所有 `_on_*` 回调函数
