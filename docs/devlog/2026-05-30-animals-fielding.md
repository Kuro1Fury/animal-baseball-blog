# 2026-05-30 — 动物系统、守备、场地、跑垒（最密集的一天）

> Commits（共 23 个，节选关键）：`2cf3c8e` `05209e8` `fe98c3e` `6413f28` `22e2b87` `e74df96` `fb6fe53` `e444c25` `e6281b4` `4d7c8c5` `1b1fe96` `549eccf` `56445c2` `d913941`

## 做了什么

这是整个项目 commit 数最多的一天（23 个）。几乎同时在推进：

- AnimalParams 静态参数系统
- AnimalController（动物移动、接球范围圆圈、精灵加载）
- FieldingJudge 椭圆接球判定
- FieldArt 程序化场地绘制
- 守备员选择逻辑（射线法 + 权重）
- 击球可视化
- 简单跑垒（RunnerController 雏形）
- Force Out 到一垒（`d913941`）

commit `4d7c8c5` / `13f8572` 叫"调参完成"——这是 Godot 开发常见节奏：先用 `@export` 在 Inspector 里实时调参，满意后把最终数值写回代码。

## 5 种动物参数

```gdscript
# animal_params.gd（截至今天的最终值）
"monkey": {"move_speed": 150.0, "catch_h_radius": 55.0, "catch_v_radius":  55.0, "catch_z_min":  0.0}
"bear":   {"move_speed":  80.0, "catch_h_radius": 40.0, "catch_v_radius":  40.0, "catch_z_min":  0.0}
"lizard": {"move_speed": 240.0, "catch_h_radius": 35.0, "catch_v_radius":  35.0, "catch_z_min":  0.0}
"eagle":  {"move_speed": 130.0, "catch_h_radius": 45.0, "catch_v_radius": 180.0, "catch_z_min": 10.0}
"croc":   {"move_speed": 100.0, "catch_h_radius": 70.0, "catch_v_radius":  35.0, "catch_z_min":  0.0}
```

鹰（v=180）和鳄鱼（h=70）是互补设计：鹰接高球，鳄鱼接地滚球。

## 椭圆接球判定

`fielding_judge.can_catch()` 实现了一个以动物为中心、以 h/v 为半径的椭圆：

```gdscript
return (dist * dist) / (h * h) + (ball_z * ball_z) / (v * v) <= 1.0
```

详见 [fielding_judge.gd 阅读指南](/code-reading/fielding_judge)。

## FieldArt：程序化场地

整个棒球场用 `Polygon2D` + `Line2D` 在 `_ready()` 里生成，无任何外部图片资源：

```gdscript
func _ready() -> void:
    for child in get_children(): child.queue_free()  # 清除残留
    _make_infield_dirt()     # 内野泥地（多边形）
    _make_pitchers_mound()   # 投手丘（圆形）
    _make_foul_lines()       # 界外线
    _make_outfield_boundary()# 外野边界
    _make_base_markers()     # 四个垒包（菱形）
```

详见 [field_art.gd 阅读指南](/code-reading/field_art)。

## Force Out 雏形（`d913941`）

这一天末尾加入了封杀出局到一垒的逻辑。跑垒员跑向一垒，如果守备员在跑者到达之前踩垒，判定 Force Out。

RunnerController 状态机（IDLE / RUNNING_TO_FIRST / SAFE / OUT）在这一天成形。

## 读完你应该能回答

- 为什么守备员选择要用"权重乘数"而不是直接选最近的守备员？
- `catch_z_min = 10.0` 对鹰的接球判定有什么影响？
- FieldArt 和 GameDirector 里的垒位逻辑如何保持坐标一致？

## 涉及文件

- `scripts/animals/animal_params.gd` — 全部
- `scripts/animals/animal_controller.gd` — `_ready()`、`_physics_process()`
- `scripts/gameplay/fielding_judge.gd` — 全部
- `scripts/field/field_art.gd` — 全部
- `scripts/gameplay/runner_controller.gd` — 全部
- `scripts/gameplay/game_director.gd` — `_select_fielder()`、`FIELDER_PROFILE_MULT`
