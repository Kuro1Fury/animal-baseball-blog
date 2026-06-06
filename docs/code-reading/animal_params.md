# animal_params.gd — 动物参数系统

**文件路径**：`scripts/animals/animal_params.gd`（14 行）

## 这个文件做什么

AnimalParams 是整个动物系统的"数据源"。它把 5 种动物的数值参数集中存储在一个常量字典里，并提供一个静态 getter。

```gdscript
class_name AnimalParams
extends RefCounted

const PARAMS := {
    "monkey": {"move_speed": 150.0, "color": Color(0.85, 0.75, 0.6), "catch_h_radius": 55.0, "catch_v_radius":  55.0, "catch_z_min":  0.0},
    "bear":   {"move_speed":  80.0, "color": Color(0.75, 0.2,  0.2), "catch_h_radius": 40.0, "catch_v_radius":  40.0, "catch_z_min":  0.0},
    "lizard": {"move_speed": 240.0, "color": Color(0.9,  0.85, 0.1), "catch_h_radius": 35.0, "catch_v_radius":  35.0, "catch_z_min":  0.0},
    "eagle":  {"move_speed": 130.0, "color": Color(0.2,  0.5,  0.9), "catch_h_radius": 45.0, "catch_v_radius": 180.0, "catch_z_min": 10.0},
    "croc":   {"move_speed": 100.0, "color": Color(0.9,  0.5,  0.1), "catch_h_radius": 70.0, "catch_v_radius":  35.0, "catch_z_min":  0.0},
}

static func get_params(animal_type: String) -> Dictionary:
    return PARAMS.get(animal_type, PARAMS["monkey"])  # 默认 fallback 到 monkey
```

## 参数含义

| 参数 | 含义 | 谁在用 |
|------|------|--------|
| `move_speed` | 守备员移速（px/s）| `animal_controller.gd`（初始化时读取）|
| `color` | 无贴图时的颜色（Polygon2D 方块）| `animal_controller.gd`（`$Body.color`）|
| `catch_h_radius` | 水平接球半径 | `fielding_judge.can_catch()`、`animal_controller`（绘制圆圈）|
| `catch_v_radius` | 垂直接球半径（高度方向）| `fielding_judge.can_catch()` |
| `catch_z_min` | 最低可接球高度 | `fielding_judge.can_catch()` |

## 5 种动物的设计逻辑

每种动物都有明确的专长和弱点：

### 猴子（monkey）：均衡型
- 速度中等，接球范围圆形（55×55）
- 在三种球型里权重都处于中等位置
- 适合作为"默认守备员"

### 熊（bear）：慢速坦克型
- 最慢（80 px/s），接球范围也小（40×40）
- 在击球可视化权重里没有明显优势，偏向特殊场景

### 蜥蜴（lizard）：速度型
- 最快（240 px/s），接球范围却最小（35×35）
- 用速度补偿范围，适合提前预判跑位

### 鹰（eagle）：高飞球专家
- 垂直接球范围极大（v=180），是猴子的 3.3 倍
- `catch_z_min = 10.0`：无法接地面球
- 高飞球权重为 0.45（最低 = 优先选中）
- 地滚球权重为 3.0（最高 = 几乎不会被选中）

### 鳄鱼（croc）：地滚球专家
- 水平接球范围最大（h=70）
- 垂直范围很小（v=35）
- 地滚球权重为 0.75（优先选中）
- 飞球权重为 2.5（几乎不会被选中）

## AnimalController 如何使用这些参数

```gdscript
# animal_controller.gd:17-26
func _ready() -> void:
    _initial_position = position
    var p := AnimalParams.get_params(animal_type)
    move_speed = p["move_speed"]          # 读取移速
    $Body.color = p["color"]             # 设置颜色
    # 绘制接球范围圆圈
    var circle := PackedVector2Array()
    for i in 24:
        var angle := TAU * i / 24.0
        circle.append(Vector2(cos(angle), sin(angle)) * p["catch_h_radius"])
    $CatchRange.polygon = circle
```

注意：接球范围圆圈只显示了 `catch_h_radius`（水平方向），不是真实椭圆形状，因为 2D 屏幕上用圆圈更直观。

## 设计模式：集中数据 vs 分散 `@export`

这个项目选择把动物参数放在**静态常量字典**里，而不是在每个动物实例上用 `@export` 单独设置。

**好处**：一处修改影响所有实例，不会出现"某个场景里的鹰参数和另一个场景不一样"的问题。

**代价**：改数值需要改代码，不能在 Inspector 里实时拖拽调整。

## 读完后你应该能回答

1. 如果要加入第 6 种动物"兔子"（超快速但接球范围极小），应该在哪里添加什么？
2. `PARAMS.get(animal_type, PARAMS["monkey"])` 的 `PARAMS["monkey"]` 是什么意思？
3. 为什么 `move_speed` 不直接用 `AnimalParams.get_params(animal_type)["move_speed"]` 而要先赋值给局部变量？

## 涉及文件

- `scripts/animals/animal_params.gd` — 全部（14 行）
- `scripts/animals/animal_controller.gd`:17-26 — 参数初始化
- `scripts/gameplay/fielding_judge.gd`:15-22 — 参数使用
- `scripts/gameplay/game_director.gd`:66-70 — `FIELDER_PROFILE_MULT` 权重表
