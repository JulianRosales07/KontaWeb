"use client"

import { Table } from "@/components/ui/heroui-table"
import { EmptyState } from "@heroui/react"
import { Inbox } from "lucide-react"

export default function EmptyStateDemo() {
  return (
    <div className="w-full p-8">
    <Table className="min-h-[200px]">
      <Table.ScrollContainer>
        <Table.Content aria-label="Empty table" className="h-full min-w-[600px]">
          <Table.Header>
            <Table.Column isRowHeader>Name</Table.Column>
            <Table.Column>Role</Table.Column>
            <Table.Column>Status</Table.Column>
            <Table.Column>Email</Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                <Inbox className="size-6 text-muted" />
                <span className="text-sm text-muted">No results found</span>
              </EmptyState>
            )}
          >
            {[]}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
    </div>
  )
}
