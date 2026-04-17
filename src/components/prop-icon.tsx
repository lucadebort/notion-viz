'use client'

import {
  Type,
  AlignLeft,
  Hash,
  CircleDot,
  LayoutList,
  Calendar,
  User,
  Paperclip,
  CheckSquare,
  Link,
  Mail,
  Phone,
  FunctionSquare,
  ArrowLeftRight,
  Sigma,
  Loader,
  MousePointerClick,
  Text,
  Clock,
  type LucideIcon,
} from 'lucide-react'

export const PROPERTY_TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  title:             { label: 'Title',           icon: Type },
  rich_text:         { label: 'Text',            icon: AlignLeft },
  number:            { label: 'Number',          icon: Hash },
  select:            { label: 'Select',          icon: CircleDot },
  multi_select:      { label: 'Multi-select',    icon: LayoutList },
  date:              { label: 'Date',            icon: Calendar },
  people:            { label: 'Person',          icon: User },
  files:             { label: 'Files',           icon: Paperclip },
  checkbox:          { label: 'Checkbox',        icon: CheckSquare },
  url:               { label: 'URL',             icon: Link },
  email:             { label: 'Email',           icon: Mail },
  phone_number:      { label: 'Phone',           icon: Phone },
  formula:           { label: 'Formula',         icon: FunctionSquare },
  relation:          { label: 'Relation',        icon: ArrowLeftRight },
  rollup:            { label: 'Rollup',          icon: Sigma },
  created_time:      { label: 'Created time',    icon: Clock },
  created_by:        { label: 'Created by',      icon: User },
  last_edited_time:  { label: 'Last edited',     icon: Clock },
  last_edited_by:    { label: 'Last edited by',  icon: User },
  unique_id:         { label: 'ID',              icon: Hash },
  status:            { label: 'Status',          icon: Loader },
  button:            { label: 'Button',          icon: MousePointerClick },
  text:              { label: 'Text',            icon: Text },
}

export function PropIcon({ type, size = 12 }: { type: string; size?: number }) {
  const meta = PROPERTY_TYPE_META[type]
  const Icon = meta?.icon ?? AlignLeft
  return <Icon size={size} className="shrink-0 text-muted-foreground" />
}
