import type { DatabaseNode } from '@/lib/notion/workspace'

export type NotionColor =
  | 'default' | 'gray' | 'brown' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export const NOTION_COLORS: NotionColor[] = [
  'default', 'gray', 'brown', 'orange', 'yellow',
  'green', 'blue', 'purple', 'pink', 'red',
]

export type SelectOptionDraft = {
  name: string
  color: NotionColor
}

export type CreatePropertyRequest = {
  name: string
  type: string
  // relation
  relationDatabaseId?: string
  isTwoWay?: boolean
  // number
  numberFormat?: string
  // select / multi_select
  selectOptions?: SelectOptionDraft[]
  // formula
  formulaExpression?: string
  // unique_id
  uniqueIdPrefix?: string
}

export type CreateDatabaseRequest = {
  parentPageId: string
  title: string
  icon?: string
  properties: CreatePropertyRequest[]
}

export type CreateDatabaseResponse = {
  database: DatabaseNode
}
