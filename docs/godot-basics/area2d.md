# Area2D：检测区域

> Area2D 是 Godot 里"感知但不碰撞"的物理节点——用来检测"有没有东西进入这个区域"，而不产生物理阻挡。

## 三种物理节点对比

| 节点 | 能被推动 | 产生阻挡 | 能检测重叠 |
|------|---------|---------|-----------|
| `StaticBody2D` | ❌ | ✅ | ❌ |
| `CharacterBody2D` | 自己控制 | ✅ | ❌ |
| `RigidBody2D` | ✅（引擎控制）| ✅ | ❌ |
| **`Area2D`** | ❌ | ❌ | ✅ |

`Area2D` 是一个"幽灵区域"：其他物体可以穿过它，但它知道有什么东西进入了。

**对 Java 开发者的类比**：类似一个数据库触发器（Trigger）——不改变数据，只在特定条件发生时执行动作。或者更像一个 IoT 的传感器——不阻挡物体，只检测物体经过。

## 基本用法

### 节点结构

```
PickupZone（Area2D）
└── CollisionShape2D（定义感应区形状）
```

### 信号连接

`Area2D` 发出的关键信号：

```gdscript
# 当另一个物理节点进入区域时
func _ready() -> void:
    $PickupZone.body_entered.connect(_on_body_entered)
    $PickupZone.body_exited.connect(_on_body_exited)
    # area_entered / area_exited：另一个 Area2D 进入/离开

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        collect_item()
```

| 信号 | 触发条件 |
|------|---------|
| `body_entered(body)` | `CharacterBody2D` 或 `RigidBody2D` 进入 |
| `body_exited(body)` | 上述节点离开 |
| `area_entered(area)` | 另一个 `Area2D` 进入 |
| `area_exited(area)` | 另一个 `Area2D` 离开 |

### 逐帧检测

也可以不用信号，直接查询当前重叠的物体：

```gdscript
func _physics_process(_delta: float) -> void:
    var bodies := $DetectZone.get_overlapping_bodies()
    for body in bodies:
        if body.has_method("take_damage"):
            body.take_damage(10)
```

## 典型应用场景

### 1. 道具拾取

```
Coin（Area2D）
└── CollisionShape2D（圆形）

当 Player 进入时 → 收集金币，播放音效，隐藏节点
```

### 2. 伤害判定区（攻击范围）

```
SwordHitbox（Area2D）
└── CollisionShape2D（剑的形状）

当攻击动画播放时启用，进入区域的敌人受到伤害
```

### 3. 触发器（走进区域触发剧情）

```
CutsceneTrigger（Area2D）
└── CollisionShape2D（大矩形）

玩家进入 → 播放剧情动画
```

### 4. 视野检测

```
EnemyVisionCone（Area2D）
└── CollisionShape2D（扇形 / 多边形）

玩家进入视野 → 敌人进入追踪状态
```

## Animal Baseball 里为什么没用 Area2D？

项目的接球判定没有用 Area2D，而是用代码里的数学计算：

```gdscript
# fielding_judge.gd — 每帧手动计算椭圆方程
static func can_catch(animal_pos: Vector2, ball_ground_pos: Vector2,
                       ball_z: float, params: Dictionary) -> bool:
    var dist := animal_pos.distance_to(ball_ground_pos)
    var h: float = params["catch_h_radius"]
    var v: float = params["catch_v_radius"]
    return (dist * dist) / (h * h) + (ball_z * ball_z) / (v * v) <= 1.0
```

原因：
1. 接球范围是**椭圆形**且涉及 z 高度（第三维），Area2D 只支持 2D 形状
2. 不同动物的接球范围参数不同（鹰 vs 鳄鱼），需要动态计算
3. 手动计算更灵活，可以集成 z 轴判定

如果接球范围只是 2D 圆形，用 Area2D + `body_entered` 会更简洁。这是两种方案的权衡。

## 碰撞层（Layer）与掩码（Mask）

Area2D 和其他物理节点都有**碰撞层**系统，控制"谁能感知谁"：

```gdscript
# 编辑器里配置，也可以代码设置
area.collision_layer = 0b0001   # 这个节点在第 1 层
area.collision_mask  = 0b0010   # 这个节点检测第 2 层的物体
```

- `collision_layer`：这个节点**属于**哪些层（别人能不能检测到我）
- `collision_mask`：这个节点**检测**哪些层（我能不能感知别人）

只有当 A 的 `layer` 与 B 的 `mask` 有交集，A 和 B 才会互相感知。

**对 Java 开发者的类比**：类似 RBAC 权限系统——layer 是"我的角色"，mask 是"我能访问哪些角色"。

详见[CollisionShape2D 与碰撞层](/godot-basics/collision)。
