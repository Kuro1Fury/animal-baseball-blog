# 术语表

本项目使用的术语，分为棒球规则术语和 Godot/代码术语两部分。

## 棒球规则术语

### At-Bat（打席）
一次轮到击球员上场击球的机会。每次 At-Bat 以三振、出局或安打结束。

### Strike（好球 / 罚球）
投球进好球带但击球员未挥棒，或击球员挥棒未击中。3 个 Strike = 三振出局。

### Out（出局）
一个击球员或跑垒员被淘汰。3 个 Out = 半局结束（Half Inning Over）。

### Force Out / Force Play（封杀出局）
跑垒员被迫推进到下一垒时，守备员在跑垒员到达之前踩垒。本项目目前只实现了对一垒的封杀。

### Safe（安全上垒）
跑垒员在守备员封垒之前到达垒包，判定安全。

### Hold（持球）
守备员接到球后，在传球前短暂持有球的状态。本项目里对应 `_fielder_holding_ball = true`。

### 守备位置编号（棒球惯例）
| 编号 | 守备位置 | 英文缩写 |
|------|----------|----------|
| 1 | 投手 | P（Pitcher）|
| 2 | 捕手 | C（Catcher）|
| 3 | 一垒手 | 1B（First Base）|
| 4 | 二垒手 | 2B（Second Base）|
| 5 | 三垒手 | 3B（Third Base）|
| 6 | 游击手 | SS（Short Stop）|
| 7 | 左外野手 | LF（Left Field）|
| 8 | 中外野手 | CF（Center Field）|
| 9 | 右外野手 | RF（Right Field）|

---

## 代码术语

### BallState
球的状态枚举：`IDLE / PITCHING / HIT_FLYING / GROUND_ROLLING / CAUGHT / THROWING / DEAD`

### plane_pos
球在地面平面上的 XY 坐标（逻辑坐标，用于物理判定）。

### height_z
球距地面的逻辑高度（自定义变量，不是 Godot 内置 z 轴）。

### pitch_elapsed
投球已经过去的时间（秒）。BattingController 用这个值判断挥棒时机。

### vz（vertical z velocity）
击球时的垂直初速度。值越大，球飞越高（趋向飞球）；值越小，球趋向地滚球。

### hit_velocity
击球后的水平速度向量（Vector2）。

### FIELDER_PROFILE_MULT
守备员选择时的类型权重表。按球型（ground/fly/normal）×动物类型，给出乘数（越小越容易被选中）。

### Hold-and-Stamp
持球后走到一垒踩垒的流程。路径 A：玩家控制持球者走到垒旁自动踩垒。

### auto_catch
自动接球模式。`true` 时只要守备员进入接球范围就自动接球；`false` 时需玩家手动按键。

### @onready
Godot 标注，表示在 `_ready()` 执行时初始化该变量（从场景树获取节点引用）。

### signal（信号）
Godot 的事件系统，类似观察者模式。发射方调用 `.emit()`，监听方通过 `.connect()` 注册回调。

### CharacterBody2D
Godot 的物理刚体节点，支持 `move_and_slide()` 方法进行碰撞移动。

### RefCounted
Godot 的轻量引用计数对象，不是节点，不在场景树里。本项目的 BattingController / FieldingJudge / AnimalParams 都继承自它。

### Marker2D
Godot 的空标记节点，只有位置，没有视觉。本项目用它标记投手板（PitcherSpot）、本垒（HomeBase）、各垒位（FirstBasePoint 等）。

### z_index
Godot 2D 的渲染层级。数值越大，越后渲染（显示在最上层）。**不是**本项目的逻辑高度 `height_z`。

### PackedVector2Array
Godot 的内存连续 Vector2 数组类型，比普通 `Array` 更高效。用于 `Polygon2D.polygon` 和 `Line2D.points`。

### TAU
数学常量 2π ≈ 6.2832。Godot 内置常量，常用于圆形计算（`TAU * i / n` = 均匀分布角度）。
