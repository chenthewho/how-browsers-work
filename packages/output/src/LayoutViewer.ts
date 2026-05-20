/**
 * 布局查看器（Layout Viewer）
 *
 * 对应 Chrome 中 DevTools 的 Elements 面板 + 布局可视化
 *
 * 将 LayoutBox 树以可读的文本格式输出，
 * 展示每个盒子的标签、类、ID、位置、尺寸和盒模型数据。
 *
 * 这是学习浏览器原理的最重要输出工具 —
 * 直接从输出中就能理解布局计算的结果。
 */

import type { LayoutBox, SerializedLayoutBox } from '@browser/shared';

export class LayoutViewer {
  /**
   * 将布局树渲染为可读的文本格式
   */
  render(root: LayoutBox): string {
    return this.renderBox(root, '', 0);
  }

  private renderBox(box: LayoutBox, indent: string, depth: number): string {
    if (depth > 20) return ''; // 防止过深的递归

    let result = '';

    // 构建标签描述
    let label = '';
    if (box.textContent !== null) {
      // 文本盒子
      const text = box.textContent.substring(0, 40).replace(/\n/g, '\\n');
      label = `TEXT "${text}"`;
    } else if (box.element) {
      const el = box.element;
      const id = el.id ? `#${el.id}` : '';
      const classes = el.className ? `.${el.className.replace(/\s+/g, '.')}` : '';
      label = `<${el.tagName.toLowerCase()}${id}${classes}>`;
    } else {
      label = '(anonymous)';
    }

    // 盒模型信息
    const r = box.rect;
    const pos = `(${r.x.toFixed(0)}, ${r.y.toFixed(0)})`;
    const size = `${r.width.toFixed(0)} × ${r.height.toFixed(0)}`;
    const boxModel = [
      `m:(${box.margin.top},${box.margin.right},${box.margin.bottom},${box.margin.left})`,
      `b:(${box.border.top},${box.border.right},${box.border.bottom},${box.border.left})`,
      `p:(${box.padding.top},${box.padding.right},${box.padding.bottom},${box.padding.left})`,
    ].join(' ');

    result += `${indent}[${box.layoutMode}] ${label}\n`;
    result += `${indent}  pos:${pos} size:${size}\n`;
    result += `${indent}  ${boxModel}\n`;

    // 递归渲染子盒子
    for (const child of box.children) {
      result += this.renderBox(child, indent + '  ', depth + 1);
    }

    return result;
  }

  /**
   * 序列化布局树（用于 IPC 传输）
   */
  serialize(box: LayoutBox): SerializedLayoutBox {
    return {
      id: box.id,
      tagName: box.element?.tagName.toLowerCase() || null,
      rect: { ...box.rect },
      margin: { ...box.margin },
      border: { ...box.border },
      padding: { ...box.padding },
      layoutMode: box.layoutMode,
      textContent: box.textContent,
      children: box.children.map(c => this.serialize(c)),
    };
  }
}
