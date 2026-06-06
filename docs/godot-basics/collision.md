# CollisionShape2D 与碰撞层

> 碰撞形状定义物体的"实体轮廓"，碰撞层控制"谁能感知谁"。

## CollisionShape2D

每个物理节点（`CharacterBody2D`、`StaticBody2D`、`Area2D`）都需要一个 `CollisionShape2D` 子节点来定义碰撞形状，否则物理引擎不知道这个节点的边界。

### 常用形状（Shape2D）

| 形状 | 适用场景 | 性能 |
|------|---------|------|
| `CircleShape2D` | 圆形物体（球、角色）| 最快 |
| `RectangleShape2D` | 矩形物体（平台、箱子）| 快 |
| `CapsuleShape2D` | 人形角色（椭圆竖置）| 快 |
| `ConvexPolygonShape2D` | 凸多边形（简单不规则形状）| 中 |
| `ConcavePolygonShape2D` | 凹多边形（复杂地形）| 慢，仅用于 StaticBody |
| `WorldBoundaryShape2D` | 无限延伸的直线（地板/边界）| 快 |

**一般规则**：
- 角色用 `CapsuleShape2D` 或 `CircleShape2D`
- 平台、墙壁用 `RectangleShape2D`
- 能用简单形状就不用多边形

### 节点结构示例

```
Monkey（CharacterBody2D）
├── Sprite2D（视觉，不影响物理）
├── CollisionShape2D
│   └── [Shape: CircleShape2D, radius: 20]   ← 物理边界
└── CatchRange（Polygon2D，纯视觉，不是物理节点）
```

注意：`CatchRange`（接球范围圆圈）是 `Polygon2D`，这是**视觉节点**，不参与物理。实际接球判定是手动计算的（见 `fielding_judge.gd`）。

## 在代码里动态修改形状

```gdscript
# 获取形状并修改
var shape := $CollisionShape2D.shape as CircleShape2D
shape.radius = 30.0

# 禁用碰撞体（不删除节点，只是停用）
$CollisionShape2D.disabled = true
$CollisionShape2D.set_deferred("disabled", true)  # 物理帧安全写法
```

项目里的用法：

```gdscript
# game_director.gd _ready()
# 跑者不需要和守备员碰撞，禁用碰撞体
_batter_runner.get_node("CollisionShape2D").set_deferred("disabled", true)
_runner_1b.get_node("CollisionShape2D").set_deferred("disabled", true)
```

## 碰撞层（Layer）与掩码（Mask）

Godot 有 32 个碰撞层（Layer 1 ~ Layer 32）。每个物理节点有两个位掩码：

- **`collision_layer`（层）**：这个节点"存在"于哪些层
- **`collision_mask`（掩码）**：这个节点"感知"哪些层

**两个节点发生碰撞/检测，需要满足**：
> A 的 `layer` ∩ B 的 `mask` ≠ 空，**或者** B 的 `layer` ∩ A 的 `mask` ≠ 空

### 典型设置

```
层定义（项目约定）：
  Layer 1 = 玩家
  Layer 2 = 敌人
  Layer 3 = 道具
  Layer 4 = 地形

玩家设置：
  collision_layer = 0b0001 (Layer 1)
  collision_mask  = 0b0110 (Layer 2 + 3，感知敌人和道具)

敌人设置：
  collision_layer = 0b0010 (Layer 2)
  collision_mask  = 0b0001 (Layer 1，感知玩家)

道具设置：
  collision_layer = 0b0100 (Layer 3)
  collision_mask  = 0b0000 (不主动感知任何人，等玩家来感知它)
```

### 代码设置

```gdscript
# 设置在 Layer 1 和 Layer 3
node.collision_layer = (1 << 0) | (1 << 2)  # 0b00000101

# 感知 Layer 2
node.collision_mask = (1 << 1)              # 0b00000010

# 检查是否在某层
if node.collision_layer & (1 << 0):
    print("在 Layer 1")
```

### 在 Inspector 里设置

编辑器里有可视化的层选择 UI，每个层可以命名（在 `Project Settings → Layer Names → 2D Physics`），不需要记数字。

## Animal Baseball 里的碰撞层

项目里守备员和跑者都是 `CharacterBody2D`，但**跑者的碰撞体被禁用**：

```gdscript
_batter_runner.get_node("CollisionShape2D").set_deferred("disabled", true)
```

所以实际上没有用到多层碰撞，所有物理节点都在默认的 Layer 1。这是 MVP 阶段的简化——跑者直接穿过守备员，不需要碰撞交互。

## 碰撞层的实际价值

| 场景 | 层设计 |
|------|--------|
| RPG | 玩家层、敌人层、友方层、地形层、道具层分开，友方和友方不碰撞 |
| 平台游戏 | 单向平台用 Layer 分离，角色可以从下跳上但不能从上跳下 |
| 棒球游戏 | 球和守备员（可能），跑者穿过守备员（禁用或不同层）|

## one_way_collision（单向碰撞）

`CollisionShape2D` 有 `one_way_collision` 属性，启用后物体只能从一侧碰撞（常用于平台跳跃游戏的单向平台）：

```gdscript
$CollisionShape2D.one_way_collision = true
```

## 在项目里找这些内容

- `animal_controller.gd`:21-26 — CatchRange 圆圈（Polygon2D，纯视觉）
- `game_director.gd`:92-95 — `set_deferred("disabled", true)` 禁用碰撞体
- `fielding_judge.gd` — 手动计算接球判定（替代 Area2D 的方案）
