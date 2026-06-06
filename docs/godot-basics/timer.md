# Timer：节点 vs float 变量

> Godot 有专门的 Timer 节点，但也可以用 float 变量自己管理倒计时。两种方式各有适用场景。

## Timer 节点

`Timer` 是 Godot 内置节点，到时间后发出 `timeout` 信号：

### 节点结构

```
MyNode
└── Timer（设置 wait_time = 2.0，one_shot = true）
```

### 代码使用

```gdscript
@onready var timer: Timer = $Timer

func _ready() -> void:
    timer.timeout.connect(_on_timer_timeout)

func start_countdown() -> void:
    timer.start()           # 开始计时（使用 wait_time）
    timer.start(3.0)        # 开始计时（指定时间）

func _on_timer_timeout() -> void:
    print("时间到！")
```

### 关键属性

```gdscript
timer.wait_time   # 等待时长（秒）
timer.one_shot    # true = 到时间停止；false = 循环触发
timer.autostart   # true = 节点加入场景树时自动开始
timer.time_left   # 剩余时间（只读）
timer.is_stopped() # 是否已停止
```

### 用 await 优雅等待

```gdscript
func do_after_delay() -> void:
    await get_tree().create_timer(2.0).timeout  # 临时 Timer，2 秒后继续
    print("2 秒后执行")
```

`get_tree().create_timer()` 创建一个一次性的临时 Timer，不需要在场景里预置节点。

## float 变量倒计时

不用 Timer 节点，在 `_process()` 里手动减少一个浮点变量：

```gdscript
# game_director.gd
var _reset_timer := -1.0   # -1 表示"未激活"

func _process(delta: float) -> void:
    if _reset_timer > 0.0:
        _reset_timer -= delta          # 每帧减少
        if _reset_timer <= 0.0:
            _do_reset()               # 倒计时结束
        return

# 启动倒计时
func _register_strike() -> void:
    _show_result("Strike!")
    _reset_timer = 0.7   # 0.7 秒后重置
```

## 两种方式对比

| 维度 | Timer 节点 | float 变量 |
|------|-----------|-----------|
| 代码量 | 多（需要信号连接）| 少（直接在 _process 里）|
| 可读性 | 高（意图明确）| 中（需要理解 -1 的含义）|
| 多个计时器 | 需要多个 Timer 节点 | 多个 float 变量即可 |
| 暂停控制 | 自动受 `get_tree().paused` 影响 | 需要手动控制 |
| 精度 | 高（物理帧级）| 依赖 `_process` 帧率 |
| 适合场景 | 独立的、可复用的计时器 | 和游戏逻辑紧密耦合的计时 |

## Animal Baseball 的选择

项目里**全部用 float 变量**：

```gdscript
var _reset_timer := -1.0  # 重置倒计时

# 用到的地方：
_reset_timer = 2.5   # 半局结束后等待 2.5 秒
_reset_timer = 1.5   # 普通结果等待 1.5 秒
_reset_timer = 0.7   # 投球结束等待 0.7 秒
```

选择原因：
1. 计时器和游戏主循环（`_process`）高度耦合，放在一起更直观
2. 菜单打开时游戏冻结（`if _setup_menu_open: return`），float 变量倒计时自然也停了，不需要额外 `timer.paused = true`
3. 只有一个计时器，不需要 Timer 节点的复杂性

**对 Java 开发者的类比**：float 变量方案类似在 `@Scheduled` 里用一个计数器 `ticksRemaining--`；Timer 节点类似 `ScheduledExecutorService.schedule(task, 2, SECONDS)`——各有适用场景。

## 什么时候用 Timer 节点？

- 计时器逻辑独立、不依赖游戏主逻辑状态
- 需要循环触发（比如每 3 秒刷新一次怪物）
- 需要精确暂停控制（配合 Godot 内置暂停系统）
- 计时器逻辑复杂，需要 `time_left` 显示进度条

## SceneTreeTimer（临时计时器）

`get_tree().create_timer()` 创建的是 `SceneTreeTimer`，不是 `Timer` 节点：

```gdscript
# 创建临时计时器，不需要在场景里预置节点
var st_timer := get_tree().create_timer(2.0)
await st_timer.timeout
# 或直接：
await get_tree().create_timer(2.0).timeout
```

临时计时器在 timeout 后自动销毁，特别适合配合 `await` 使用。

## 实际代码示例：两种方式实现同一功能

```gdscript
# 方式 A：float 变量（项目实际使用）
var _reset_timer := -1.0

func _process(delta: float) -> void:
    if _reset_timer > 0.0:
        _reset_timer -= delta
        if _reset_timer <= 0.0:
            _do_reset()

func _register_out(text: String) -> void:
    _show_result(text)
    _reset_timer = 1.5


# 方式 B：Timer 节点（等效写法）
@onready var reset_timer: Timer = $ResetTimer

func _ready() -> void:
    reset_timer.timeout.connect(_do_reset)

func _register_out(text: String) -> void:
    _show_result(text)
    reset_timer.start(1.5)


# 方式 C：await（最简洁，但改变了函数为协程）
func _register_out(text: String) -> void:
    _show_result(text)
    await get_tree().create_timer(1.5).timeout
    _do_reset()
```

## 在项目里找这些内容

- `game_director.gd`:27 — `_reset_timer` 变量声明
- `game_director.gd`:163-170 — `_process()` 里的倒计时逻辑
- `game_director.gd`:397-405 — `_register_out()` 设置 `_reset_timer`
