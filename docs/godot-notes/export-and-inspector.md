# @export 与 Inspector 调参

## 什么是 @export

在 GDScript 里，`@export` 标注一个变量，让它出现在 Godot 编辑器的 Inspector 面板里，可以在不改代码的情况下实时修改数值。

## 项目里的用法

`ball_controller.gd` 把所有需要调参的数值都暴露为 `@export`：

```gdscript
@export var pitch_duration:  float = 1.5    # 投球时长
@export var pitch_peak_z:    float = 100.0  # 弧顶高度
@export var pitch_arrive_z:  float = 60.0   # 过本垒高度
@export var ground_friction: float = 150.0  # 地滚球减速率
@export var min_ground_speed: float = 30.0  # 最低滚动速度
```

`game_director.gd` 同样有多个：

```gdscript
@export var auto_catch              := true
@export var throw_to_first_speed    := 600.0
@export var throw_arrive_threshold  := 20.0
@export var force_base_touch_radius := 40.0
@export var runner_advance_speed    := 200.0
```

## @export 与 const 的区别

| | `@export` | `const` |
|-|-----------|---------|
| 在 Inspector 显示 | ✅ | ❌ |
| 可以运行时修改 | ✅（通过 Inspector 或代码）| ❌ |
| 适合用途 | 需要调整的游戏参数 | 绝对不变的物理常量 |

项目里：
- `@export var pitch_duration = 1.5` — 投球时长（经常调整）
- `const GRAVITY = 200.0` — 重力（物理常量，不应该变）
- `const GROUND_BALL_HEIGHT_THRESHOLD = 3.0` — 地面阈值（物理约定）

## 两种写法

```gdscript
@export var pitch_duration: float = 1.5   # 显式类型
@export var auto_catch := true            # 从初始值推断类型（bool）
```

`:=` 是 GDScript 的类型推断赋值，Godot 会自动推断 `auto_catch` 是 `bool` 类型。

## 实际调参工作流

项目 commit `4d7c8c5` / `13f8572` 叫"调参完成"，就是通过在 Inspector 里反复修改 `@export` 变量，找到手感最好的数值组合，然后把最终值写回代码里作为默认值。

这是 Godot 游戏开发的常见工作流：**先 @export 调到满意，再把数值"烘焙"进代码**。

## 项目里的另一种参数存储方式

`animal_params.gd` 没有用 `@export`，而是用静态常量字典：

```gdscript
const PARAMS := {
    "monkey": {"move_speed": 150.0, ...},
    ...
}
```

这是因为动物参数需要按类型查找，用字典比每个动物实例单独设置 `@export` 更统一。

## 在项目里找这些内容

- `ball_controller.gd`:11-18 — 全部 `@export` 参数
- `game_director.gd`:3-6 — GameDirector 的调参项
- `animal_params.gd`:4-10 — 集中式参数字典（替代 @export 的方案）
