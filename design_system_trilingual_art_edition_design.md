---
name: Obsidian & Ochre (Trilingual Art Edition)
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1a1a'
  on-surface-variant: '#444444'
  outline: '#737373'
  outline-variant: '#c2c2c2'
  primary: '#1a1a1a'
  on-primary: '#ffffff'
  primary-container: '#333333'
  on-primary-container: '#ffffff'
  secondary: '#a67c52'
  on-secondary: '#ffffff'
  secondary-container: '#ebdccb'
  on-secondary-container: '#281808'
  tertiary: '#4a4a4a'
  on-tertiary: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'

typography:
  fonts:
    headline-latin: "Instrument Serif, serif"
    body: "Source Sans 3, system-ui, sans-serif"
    art-zh: "'Noto Serif SC', 'Source Han Serif CN', serif"
  
  strategies:
    ZH (Chinese):
      family: "art-zh"
      style: "Museum Song aesthetic; display weight 300, tracking ~0.08em; body uses Source Sans 3."
      usage: "Display titles in Noto Serif SC; UI and long-form body in Source Sans 3."
    EN (English):
      family: "headline-latin"
      style: "Contemporary gallery serif (Instrument Serif); italic for quotes; body Source Sans 3."
      usage: "High-contrast display headlines; Source Sans 3 for nav, labels, and reading text."
    FR (French):
      family: "headline-latin"
      style: "Latin Extended via Instrument Serif + Source Sans 3; diacritics (é, à, ç) supported."
      usage: "Same stack as EN; maintain rhythmic spacing for narrative fragments."

site_images:
  admin_tab: "相册 (Photos)"
  slots:
    - home_hero: "首页顶部大图"
    - about_portrait: "关于页肖像"
    - home_preview_0..4: "首页相册预览 mosaic（五格）"
  notes: "Assigned photos are excluded from public /gallery; empty slots fall back to Stitch placeholders."

principles:
  - name: "The Void & The Murmur (留白与沉吟)"
    description: "Prioritize negative space to allow visual breathing room, reflecting the core philosophy of 'waiting for the wind'."
  - name: "Editorial Rigor"
    description: "Layouts should feel like a premium physical magazine, with asymmetrical grids and intentional typographic hierarchy."
  - name: "Linguistic Fluidity"
    description: "Seamless transitions between Chinese, English, and French via a minimalist language switcher, maintaining visual weight across all three."

components:
  - name: "Trilingual Header"
    description: "Minimalist navigation with an integrated (ZH / EN / FR) toggle."
  - name: "Artistic Gallery Grid"
    description: "High-contrast monochrome imagery with subtle ochre accents and multi-lingual captions."
---

# Design System: Obsidian & Ochre (Trilingual Art Edition)

## 核心哲学 (Core Philosophy)
本设计系统旨在为“等风来”个人网站提供一种冷静、深邃且具有艺术张力的视觉框架。通过深炭黑与纯白的强对比，结合中、英、法三语的艺术化排版，营造出一种跨越国界的“冷静观察者”美学。

## 语言与排版 (Linguistic Typography)

### 1. 中文版 (ZH)
*   **字体特征**：选用具有文人气质的艺术衬线体。
*   **排版逻辑**：强调“气韵生动”，利用大面积留白衬托文字的重量。
*   **适用场景**：随想标题、核心引言。

### 2. 英文版 (EN)
*   **字体特征**：经典的 EB Garamond。
*   **排版逻辑**：模仿现代独立杂志（Independent Magazine）的干练感。
*   **适用场景**：全球化视角的内容表达、技术说明。

### 3. 法文版 (FR)
*   **字体特征**：强调曲线美感的衬线体。
*   **排版逻辑**：利用法语长句带来的节奏感，结合优雅的变音符号作为视觉装饰。
*   **适用场景**：艺术感悟、文学片段。

## 色彩规范 (Color Palette)
*   **Obsidian (曜石黑)**：`#1A1A1A` - 用于文字、核心组件及深色背景。
*   **Alabaster (冷白)**：`#F9F9F9` - 主背景色，提供极致的纯净感。
*   **Ochre (赭石金)**：`#A67C52` - 极少量的点缀色，用于强调或微妙的链接反馈。

## 影像规范 (Visual Assets)
所有摄影作品应遵循高对比度、低饱和度的原则。优先使用黑白影像或冷调自然光影，以维持全站的“高级感”与“静谧感”。
