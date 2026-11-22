import { videoCategories } from './videoMeta'

export const kinds = ['文字稿', '视频', '播客', '书籍与手册', '喜剧点评与创作解析'] as const
export type Kind = typeof kinds[number]

export const groups: Record<Kind, string[]> = {
  '文字稿': [],
  '视频': [...videoCategories.map(category => category.label), '综艺推荐', '演出合集'],
  '播客': ['整档推荐', '单集推荐'],
  '书籍与手册': ['书籍', '创作和表演手册'],
  '喜剧点评与创作解析': [],
}
