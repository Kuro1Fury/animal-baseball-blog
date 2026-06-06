# 2D 坐标系与 Vector2

## Godot 2D 坐标系

Godot 的 2D 坐标系：
- **原点 (0, 0)**：屏幕左上角
- **x 轴**：向右为正
- **y 轴：向下为正**（和数学课相反！）

这一点非常重要，很多从数学/物理背景过来的人会在这里犯错。

```
(0,0) ──── x+ ────→
  │
  y+
  │
  ↓
(1280, 750)（屏幕右下角，本项目的场景大小）
```

## 项目里的坐标含义

```gdscript
# field_art.gd
const HOME_POS    := Vector2(640, 620)   # 本垒：屏幕中下方
const PITCHER_POS := Vector2(640, 430)   # 投手板：中间偏下
const SECOND_POS  := Vector2(640, 310)   # 二垒：中间偏上（y 更小）
```

二垒的 y 比投手板小（310 < 430），因为二垒在屏幕更靠上的位置（外野方向）。

## Vector2 的常用操作

### 向量加减：移动

```gdscript
plane_pos += hit_velocity * delta   # 每帧移动
```

### 向量长度：距离

```gdscript
animal_pos.distance_to(ball_ground_pos)   # 两点间距离
to_target.length()                         # 向量的长度
```

### 归一化：方向

```gdscript
to_target.normalized()   # 保持方向，长度变为 1.0
```

```gdscript
# runner_controller.gd
batter_runner.velocity = to_target.normalized() * run_speed
```

把"目标向量"变成"单位方向"，再乘以速度，得到速度向量。这是 2D 移动的标准写法。

### 线性插值：lerp

```gdscript
plane_pos = _pitch_from.lerp(_pitch_to, t)
```

`lerp(to, t)` 在 `_pitch_from` 和 `_pitch_to` 之间插值：t=0 时返回 `_pitch_from`，t=1 时返回 `_pitch_to`，t=0.5 返回中点。

### 内积：射线得分

```gdscript
# game_director.gd:603-608
func _ray_score(point: Vector2, origin: Vector2, dir: Vector2, radius: float) -> float:
    var to_point := point - origin
    var proj     := to_point.dot(dir)     # 内积
    if proj <= 0.0:
        return INF  # animal is behind the ball
    return point.distance_to(origin + dir * proj) / radius
```

内积 `a.dot(b)` = `|a| * |b| * cos(角度)`。这里 `dir` 是单位向量（`|dir|=1`），所以 `to_point.dot(dir)` = 点在 `dir` 方向上的投影距离。

当 `proj <= 0`，守备员在球的"背后"（相对击球方向），返回无穷大分数（不会被选中）。

## 全局坐标 vs 局部坐标

Godot 节点有两套坐标：
- `position`：相对于父节点的坐标（局部）
- `global_position`：相对于场景根节点的坐标（全局）

项目里的转换：

```gdscript
# game_director.gd:631
var from: Vector2 = _tf.to_local(source.global_position)
```

`_tf` 是场景根节点，`to_local()` 把全局坐标转换成相对于该节点的局部坐标。

BallController 的节点在场景根节点下，所以它的 `position`（局部）就等于全局坐标——所以 `ball.global_position` 和 `ball.plane_pos` 应该保持一致。

## `get_vector`：4 方向输入

```gdscript
# animal_controller.gd:67
var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
```

`get_vector` 把 4 个动作映射成一个 Vector2，已经归一化（斜向移动不会变快），是处理 8 方向键盘移动的推荐做法。

## 在项目里找这些内容

- `ball_controller.gd`:26-32 — `plane_pos`、`height_z` 逻辑坐标
- `game_director.gd`:603-608 — `_ray_score()`（内积应用）
- `runner_controller.gd`:41-47 — 向量归一化移动
- `field_art.gd`:4-8 — 坐标常量（对照场景理解位置）
