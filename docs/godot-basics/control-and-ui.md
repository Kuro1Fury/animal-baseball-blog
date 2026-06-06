# Control 节点与 UI 系统

> Godot 的 UI 系统基于 `Control` 节点体系，和游戏世界的 `Node2D` 是两套独立的坐标系统。

## Control vs Node2D

Godot 里有两大节点体系：

| 体系 | 基类 | 坐标系 | 用途 |
|------|------|--------|------|
| 游戏世界 | `Node2D` | 游戏世界坐标（可被 Camera 移动）| 角色、道具、场地 |
| UI 系统 | `Control` | 屏幕坐标（固定在屏幕上）| 按钮、标签、面板、HUD |

`Control` 节点永远贴在屏幕上，不随 Camera 移动。这是 HUD（血条、计分、菜单）不随游戏世界滚动的原因。

## 常用 Control 节点

| 节点 | 用途 | Java/Web 类比 |
|------|------|--------------|
| `Label` | 显示文字（只读）| `<span>` / `JLabel` |
| `Button` | 可点击按钮 | `<button>` / `JButton` |
| `OptionButton` | 下拉选择 | `<select>` / `JComboBox` |
| `TextEdit` | 多行文本输入 | `<textarea>` / `JTextArea` |
| `LineEdit` | 单行文本输入 | `<input type="text">` |
| `Panel` | 背景面板（容器）| `<div>` with background / `JPanel` |
| `VBoxContainer` | 垂直布局容器 | CSS flexbox column / `BoxLayout` |
| `HBoxContainer` | 水平布局容器 | CSS flexbox row |
| `MarginContainer` | 添加边距的容器 | CSS padding |
| `GridContainer` | 网格布局 | CSS grid |

## 项目里的 UI 实现

### Label（HUD 和 Debug 信息）

项目里用两个 `Label` 节点显示游戏信息：

```gdscript
# game_director.gd _ready()
result_label.add_theme_font_size_override("font_size", 42)
result_label.add_theme_color_override("font_color", Color(1, 1, 0))        # 黄色
result_label.add_theme_color_override("font_outline_color", Color(0, 0, 0)) # 黑色描边
result_label.add_theme_constant_override("outline_size", 4)
```

`add_theme_*_override` 是 Control 节点的样式设置方法，在代码里直接覆盖主题（相当于 CSS inline style）。

### TrainingSetupPanel（完整 UI 示例）

`training_setup_panel.gd` 是项目里最完整的 UI 示例，完全用代码构建：

```gdscript
# training_setup_panel.gd _ready()
func _ready() -> void:
    # 根容器：Panel 加 MarginContainer 加内边距
    var margin := MarginContainer.new()
    margin.set_anchors_preset(Control.PRESET_FULL_RECT)   # 填满父节点
    margin.add_theme_constant_override("margin_left",  12)
    margin.add_theme_constant_override("margin_right", 12)
    margin.add_theme_constant_override("margin_top",   12)
    margin.add_theme_constant_override("margin_bottom",12)
    add_child(margin)

    # 垂直布局
    var vbox := VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 8)  # 子节点间距
    margin.add_child(vbox)

    # 标题
    var title := Label.new()
    title.text = "─ Training Setup ─"
    title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    vbox.add_child(title)

    # 行：Label + OptionButton
    _strikes_option = _add_row(vbox, "Strikes:", ["0", "1", "2"])
    _outs_option    = _add_row(vbox, "Outs:",    ["0", "1", "2"])

    # 按钮
    var apply_btn := Button.new()
    apply_btn.text = "Apply"
    apply_btn.pressed.connect(_on_apply_pressed)  # 按钮点击信号
    vbox.add_child(apply_btn)
```

### 辅助函数：_add_row

```gdscript
func _add_row(parent: VBoxContainer, lbl_text: String, options: Array) -> OptionButton:
    var hbox := HBoxContainer.new()    # 水平布局
    parent.add_child(hbox)

    var lbl := Label.new()
    lbl.text = lbl_text
    lbl.custom_minimum_size = Vector2(72, 0)  # 最小宽度，保证对齐
    hbox.add_child(lbl)

    var opt := OptionButton.new()
    for o in options:
        opt.add_item(o)               # 添加选项
    opt.size_flags_horizontal = Control.SIZE_EXPAND_FILL  # 水平方向填充剩余空间
    hbox.add_child(opt)
    return opt
```

**对 Java/Web 开发者的类比**：
```html
<!-- 等效的 HTML -->
<div style="display:flex; flex-direction:row">
  <label style="min-width:72px">Strikes:</label>
  <select style="flex:1">
    <option>0</option><option>1</option><option>2</option>
  </select>
</div>
```

## 锚点系统（Anchor）

Control 节点用**锚点**（Anchor）定义自己相对于父节点的位置和大小：

```gdscript
margin.set_anchors_preset(Control.PRESET_FULL_RECT)
// 等同于把四个锚点都设为边缘：左=0, 右=1, 上=0, 下=1
// 节点会填满整个父节点
```

常用锚点预设：

| 预设 | 效果 |
|------|------|
| `PRESET_FULL_RECT` | 填满父节点 |
| `PRESET_CENTER` | 居中 |
| `PRESET_TOP_LEFT` | 左上角固定 |
| `PRESET_BOTTOM_RIGHT` | 右下角固定 |

**对 Web 开发者的类比**：锚点类似 CSS 的 `position: absolute` + `top/right/bottom/left` 百分比——定义控件相对父容器的位置关系。

## size_flags：布局权重

在容器里，`size_flags_horizontal` / `size_flags_vertical` 控制节点如何分配空间：

```gdscript
opt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
// 水平方向：占满剩余空间（类似 CSS flex-grow: 1）
```

| Flag | 含义 |
|------|------|
| `SIZE_SHRINK_BEGIN` | 靠左/靠上，取最小尺寸 |
| `SIZE_FILL` | 填满分配的空间 |
| `SIZE_EXPAND` | 参与空间分配竞争 |
| `SIZE_EXPAND_FILL` | 竞争 + 填满（最常用）|

## CanvasLayer：UI 永远在最上层

如果游戏世界有 `Camera2D`，UI 节点放在普通 Node2D 层会随相机移动。解决方案：把 UI 放在 `CanvasLayer` 里：

```
MainScene
├── GameWorld（Node2D）
│   ├── Camera2D
│   ├── Player（CharacterBody2D）
│   └── ...
└── HUD（CanvasLayer）    ← UI 在这里，不受 Camera 影响
    ├── HealthBar（ProgressBar）
    └── ScoreLabel（Label）
```

Animal Baseball 没有 Camera2D，所以 UI 节点直接放在场景根节点下，不需要 CanvasLayer。

## 按钮信号

Button 点击时发出 `pressed` 信号：

```gdscript
apply_btn.pressed.connect(_on_apply_pressed)

func _on_apply_pressed() -> void:
    var base_state: String = _BASE_OPTIONS[_bases_option.selected]
    setup_applied.emit(_strikes_option.selected, _outs_option.selected, base_state)
    hide()
```

`_bases_option.selected` 是 OptionButton 当前选中的索引（int）。

## 代码构建 UI vs 场景文件构建 UI

| 方式 | 优点 | 缺点 |
|------|------|------|
| 代码（`.gd`）| 动态、不依赖编辑器、版本控制友好 | 不直观，难以预览 |
| 场景文件（`.tscn`）| 可视化拖拽、所见即所得 | 复杂 diff，不易动态调整 |

项目的 `TrainingSetupPanel` 选择纯代码实现，因为它是调试工具，不需要可视化预览；同时避免了 `.tscn` 文件的 merge 冲突。

## 在项目里找这些内容

- `game_director.gd`:80-91 — Label 样式设置（`add_theme_*_override`）
- `training_setup_panel.gd` — 全部（67 行，完整的代码构建 UI 示例）
- `game_director.gd`:342-370 — `_update_hud_label()`（动态更新 Label 文本）
