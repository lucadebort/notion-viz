import type { DatabaseNode } from '@/lib/notion/workspace'

export type CreatePropertyRequest = {
  name: string
  type: string
  relationDatabaseId?: string
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
