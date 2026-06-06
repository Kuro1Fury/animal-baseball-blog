# fielding_judge.gd — 接球判定系统

**文件路径**：`scripts/gameplay/fielding_judge.gd`（22 行）

## 这个文件做什么

FieldingJudge 是另一个纯工具类（`extends RefCounted`，全 `static`），只做两件事：

1. **`select_fielder(vz)`** — 根据击球的垂直速度，判断球的类型（eagle / croc / monkey）
2. **`can_catch(animal_pos, ball_pos, ball_z, params)`** — 判断守备员是否在接球范围内

整个文件只有 22 行，但包含了一个优雅的椭圆判定数学。

## `select_fielder`：从物理公式反推球的类型

```gdscript
static func select_fielder(vz: float) -> String:
    var peak := vz * vz / (2.0 * BallController.GRAVITY)
    if peak >= HIGH_PEAK: return "eagle"   # 最高点 ≥ 60px → 高飞球
    if peak  < LOW_PEAK:  return "croc"   # 最高点 < 20px → 地滚球
    return "monkey"
```

`vz * vz / (2 * g)` 是物理公式：初速度为 `vz`、重力为 `g` 时，抛体的最高点高度。

这个函数的返回值其实只用于 `_ball_type_text()`（显示给玩家看的文字），**实际的守备员选择**由 `game_director._select_fielder()` 完成（射线法 + 权重）。两者设计意图不同，不要混淆。

## `can_catch`：椭圆方程

```gdscript
static func can_catch(animal_pos: Vector2, ball_ground_pos: Vector2,
                       ball_z: float, params: Dictionary) -> bool:
    if ball_z < params["catch_z_min"]:
        return false
    var dist := animal_pos.distance_to(ball_ground_pos)
    var h: float = params["catch_h_radius"]
    var v: float = params["catch_v_radius"]
    return (dist * dist) / (h * h) + (ball_z * ball_z) / (v * v) <= 1.0
```

标准椭圆方程：`x²/a² + y²/b² ≤ 1`

| 变量 | 对应含义 |
|------|----------|
| `dist` | 守备员到球的水平距离（x 轴）|
| `ball_z` | 球的高度（y 轴）|
| `h` | 水平接球半径 |
| `v` | 垂直接球半径（即高度范围）|

### 为什么用椭圆而不是圆形或矩形？

- 圆形只能控制水平范围，忽略高度
- 矩形判定有边角问题（角落不自然）
- 椭圆允许水平和垂直方向独立调参，且数学上"平滑"

### 各动物接球范围可视化

```
鳄鱼（croc）：   h=70, v=35     宽扁椭圆 → 适合地滚球
鹰（eagle）：    h=45, v=180    高窄椭圆 → 适合高飞球
猴子（monkey）： h=55, v=55     接近圆形 → 均衡
蜥蜴（lizard）： h=35, v=35     小圆 → 范围小但移速快补偿
熊（bear）：     h=40, v=40     小圆 → 范围小
```

### `catch_z_min` 的作用

鹰的 `catch_z_min = 10.0`，这意味着**鹰无法接地面上的球**。即使球在鹰脚下，只要 `ball_z < 10`，判定直接返回 `false`。这符合直觉：鹰不擅长接地滚球。

## 在 GameDirector 中的调用位置

```gdscript
# game_director.gd:211-215（自动接球判断）
var params   := AnimalParams.get_params(_active_fielder.animal_type)
var in_range := FieldingJudge.can_catch(
    _active_fielder.global_position,
    ball.global_position,
    ball.height_z,
    params
)
if auto_catch and in_range:
    _on_caught()
```

## 读完后你应该能回答

1. 鹰的接球椭圆和鳄鱼的接球椭圆分别长什么形状（在纸上画一下）？
2. 如果球在高度 50px、水平距离 40px 的位置，猴子（h=55, v=55）能接到吗？（带入公式算一下）
3. `catch_z_min` 存在的意义是什么？如果去掉它，鹰会有什么变化？
4. `select_fielder` 和 `game_director._select_fielder` 的区别是什么？各自的返回值用在哪里？
