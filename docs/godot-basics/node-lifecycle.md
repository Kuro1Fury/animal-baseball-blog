# 节点生命周期：_ready、_process、_physics_process

> Godot 引擎在特定时机自动调用这些方法，你只需重写它们。

## 完整生命周期

一个节点从创建到销毁，Godot 会依次触发这些回调：

```
实例化
  → _init()          # 类似构造函数（很少用）
  → 加入场景树
  → _ready()         # 节点和所有子节点都就绪
  → 每帧循环：
      → _process(delta)
      → _physics_process(delta)
  → 离开场景树
  → _exit_tree()     # 清理回调（类似 @PreDestroy）
  → 销毁
```

在实际开发中，你最常用的是 `_ready()` 和 `_process()` / `_physics_process()`。

## _ready()

**什么时候调用**：节点和它所有的子节点都加入场景树之后，调用一次。

**用来做什么**：初始化工作。

```gdscript
func _ready() -> void:
    # 安全访问子节点（此时子节点已就绪）
    var p := AnimalParams.get_params(animal_type)
    move_speed = p["move_speed"]
    $Body.color = p["color"]
    _initial_position = position
```

**对 Java 开发者的类比**：`@PostConstruct` 方法——所有依赖注入完成后调用一次。

### 为什么不用 _init()（构造函数）访问子节点？

`_init()` 在节点实例化时立刻调用，此时子节点可能还没有加入场景树，用 `$` 访问子节点会失败。`_ready()` 保证子树已就绪，所以访问子节点要在 `_ready()` 里。

```gdscript
func _init() -> void:
    # ❌ 危险：子节点可能还不存在
    # $BallSprite.position.y = 0

func _ready() -> void:
    # ✅ 安全：子节点已就绪
    $BallSprite.position.y = 0
```

## _process(delta)

**什么时候调用**：每一帧渲染前调用一次，频率等于帧率（如 60fps）。

**delta**：上一帧到这一帧的时间间隔（秒）。如果帧率稳定在 60fps，delta ≈ 0.0167s。

**用来做什么**：UI 更新、游戏逻辑、非物理的逐帧计算。

```gdscript
func _process(delta: float) -> void:
    _update_hud_label()       # 每帧更新 UI
    _update_debug_label()     # 每帧更新 Debug 信息

    if _reset_timer > 0.0:    # 倒计时
        _reset_timer -= delta
        if _reset_timer <= 0.0:
            _do_reset()
```

**对 Java 开发者的类比**：一个 `@Scheduled(fixedRate = 16)` 的方法，但频率更高，而且是游戏引擎控制的。

### delta 的重要性

如果不用 delta，游戏速度会随帧率变化：

```gdscript
# ❌ 错误：帧率不同速度不同
position.x += 5.0

# ✅ 正确：无论帧率多少，每秒移动 300px
position.x += 300.0 * delta
```

把移动量单位理解为"**每秒**移动多少"，乘以 delta 换算成"这一帧移动多少"。

## _physics_process(delta)

**什么时候调用**：物理引擎每一步调用一次，**频率固定**（默认 60Hz），与渲染帧率解耦。

**用来做什么**：
- 调用 `move_and_slide()` 等物理移动方法
- 涉及物理碰撞的逻辑
- 需要固定时间步长的计算（如游戏内物理模拟）

```gdscript
# animal_controller.gd
func _physics_process(_delta: float) -> void:
    if not controlled:
        return
    var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = dir * move_speed
    move_and_slide()   # ← 必须在 _physics_process 里调用
```

**对 Java 开发者的类比**：`_physics_process` 类似一个由独立线程驱动的固定频率调度，保证物理计算的时间步长稳定，不受渲染性能波动影响。

### 为什么 move_and_slide() 必须在 _physics_process 里？

`move_and_slide()` 依赖物理引擎的状态（碰撞体、碰撞空间），物理引擎只在物理帧里更新这些状态。在 `_process()` 里调用会收到警告，结果也不正确。

## 三者对比

| 方法 | 调用时机 | 调用次数 | 典型用途 |
|------|----------|----------|----------|
| `_ready()` | 节点就绪时 | **一次** | 初始化 |
| `_process(delta)` | 每渲染帧 | 每帧，帧率相关 | UI、逻辑、输入检测 |
| `_physics_process(delta)` | 每物理步 | 每帧，**固定频率** | 物理移动、碰撞 |

## 项目里的分工

Animal Baseball 的分工清晰：

**`_process` 使用者**：`GameDirector`
- 更新 HUD、Debug 标签（UI）
- 检测踩垒距离（逻辑）
- 倒计时 `_reset_timer`（逻辑）

**`_physics_process` 使用者**：`BallController`、`AnimalController`、`RunnerController`
- 球的位置计算（物理）
- 守备员移动 + `move_and_slide()`（物理）
- 跑者移动 + `move_and_slide()`（物理）

## 可以不重写吗？

可以。如果你不需要某个回调，就不写这个函数，Godot 不会报错。不写 `_process()` 意味着这个节点没有逐帧逻辑，完全合理（比如 `Marker2D` 节点通常没有任何脚本）。
