# 物理节点：CharacterBody2D 与运动

> Godot 有几种物理节点，CharacterBody2D 是用于"玩家可控角色"的那种。

## Godot 的物理节点类型

| 类型 | 用途 |
|------|------|
| `StaticBody2D` | 不动的物体（墙、地板）|
| `RigidBody2D` | 完全由物理引擎控制（球、木箱）|
| `CharacterBody2D` | **代码控制移动**，引擎处理碰撞（角色、NPC）|

Animal Baseball 里的守备员和跑者都是 `CharacterBody2D`——你写代码决定它往哪走，物理引擎负责让它不穿墙。

## CharacterBody2D 的移动模型

```gdscript
extends CharacterBody2D

func _physics_process(_delta: float) -> void:
    # 1. 设置速度向量（每秒移动多少像素，方向 + 大小）
    var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = dir * move_speed   # velocity 是 CharacterBody2D 的内置属性

    # 2. 调用 move_and_slide()，引擎处理碰撞并实际移动节点
    move_and_slide()
```

关键点：
- **`velocity`**：`CharacterBody2D` 的内置 `Vector2` 属性，单位是"像素/秒"
- **`move_and_slide()`**：按 `velocity` 移动，遇到碰撞体会沿表面滑动（不穿透）
- **必须在 `_physics_process()` 里调用**（见[节点生命周期](/godot-basics/node-lifecycle)）

## velocity 不乘 delta

注意这里 `velocity = dir * move_speed` **没有乘以 delta**：

```gdscript
velocity = dir * move_speed   # ← 无 delta
move_and_slide()
```

这是因为 `velocity` 的单位本身就是"每秒"，`move_and_slide()` 内部会读取物理步长并自动换算。

对比 `_process()` 里手动移动时需要乘 delta：

```gdscript
# _process() 里手动移动 position —— 需要 delta
position += direction * speed * delta

# _physics_process() 里用 move_and_slide() —— velocity 不用乘 delta
velocity = direction * speed
move_and_slide()
```

## 碰撞体（CollisionShape2D）

`CharacterBody2D` 要能碰撞，必须有一个 `CollisionShape2D` 子节点定义碰撞形状：

```
MonkeyFielder（CharacterBody2D）
├── Sprite2D（贴图）
├── CollisionShape2D（碰撞形状，通常是圆形或矩形）
├── CatchRange（Polygon2D，接球范围圆圈，仅视觉）
└── NameLabel（Label）
```

项目里有一个有趣的操作——**禁用跑者的碰撞体**：

```gdscript
# game_director.gd _ready()
_batter_runner.get_node("CollisionShape2D").set_deferred("disabled", true)
_runner_1b.get_node("CollisionShape2D").set_deferred("disabled", true)
```

原因：跑者不需要和守备员发生物理碰撞，禁用碰撞体让跑者可以穿过守备员。用 `set_deferred` 而不是直接赋值，是因为物理属性不能在物理帧中间修改，`set_deferred` 会推迟到当前物理步结束后执行。

## 边界约束

移动后用 `clamp` 把位置限制在场地范围内：

```gdscript
# animal_controller.gd
const FIELD_MIN := Vector2(30.0, 30.0)
const FIELD_MAX := Vector2(1250.0, 690.0)

func _physics_process(_delta: float) -> void:
    # ...
    move_and_slide()
    position.x = clamp(position.x, FIELD_MIN.x, FIELD_MAX.x)  # 限制 x 范围
    position.y = clamp(position.y, FIELD_MIN.y, FIELD_MAX.y)  # 限制 y 范围
```

`move_and_slide()` 不会自动限制在场地内（它只处理碰撞体），所以用 `clamp` 手动约束。

**对 Java 开发者的类比**：类似在业务逻辑里做边界校验 `Math.clamp(value, min, max)`。

## 朝向目标移动

跑者不受玩家控制，自动朝一垒跑：

```gdscript
# runner_controller.gd
func _physics_process(_delta: float) -> void:
    if state != State.RUNNING_TO_FIRST:
        return

    var to_target := first_base_point.global_position - batter_runner.global_position
    if to_target.length() < arrive_threshold:  # 到达目标
        state = State.SAFE
        batter_runner.velocity = Vector2.ZERO
        reached_first_base.emit()
        return

    batter_runner.velocity = to_target.normalized() * run_speed  # 方向 × 速度
    batter_runner.move_and_slide()
```

`to_target` 是从当前位置指向目标的向量。`.normalized()` 把它变成单位方向向量，再乘以速度得到速度向量。这是 2D 游戏"追踪目标"移动的标准写法。

## 三种运动方式对比（项目里都用到了）

| 方式 | 代码 | 用途 |
|------|------|------|
| `move_and_slide()` | `velocity = dir * speed; move_and_slide()` | 守备员/跑者（有碰撞）|
| 直接修改 `position` | `position += delta_pos` | Runner1B 推进到二垒（跑者无碰撞）|
| 直接修改 `global_position` | `runner.global_position += dir * speed * delta` | Runner1B 推进（无 CharacterBody2D 物理需求）|

项目里 `_advance_runner_1b()` 用直接修改 `global_position` 而不是 `move_and_slide()`，因为 Runner1B 的碰撞体已被禁用，不需要物理碰撞，直接移动更简单。

## 在项目里找这些内容

- `animal_controller.gd`:59-71 — 完整的 CharacterBody2D 移动实现
- `runner_controller.gd`:38-48 — 追踪目标的移动
- `game_director.gd`:92-95 — 禁用碰撞体（set_deferred）
- `game_director.gd`:823-828 — 直接修改 global_position（Runner1B 推进）
