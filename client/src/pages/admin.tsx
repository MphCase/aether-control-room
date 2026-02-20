import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminUsers } from "@/components/AdminUsers";
import { AdminPrompts } from "@/components/AdminPrompts";
import { AdminTriggers } from "@/components/AdminTriggers";
import { ArrowLeft, Users, FileText, Zap as ZapIcon, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-admin-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-semibold tracking-tight">Admin Panel</h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="users" className="flex flex-col h-full">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              <TabsTrigger value="users" className="text-xs py-2 px-3 data-[state=active]:bg-muted rounded-b-none" data-testid="tab-admin-users">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Users
              </TabsTrigger>
              <TabsTrigger value="prompts" className="text-xs py-2 px-3 data-[state=active]:bg-muted rounded-b-none" data-testid="tab-admin-prompts">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Prompt Studio
              </TabsTrigger>
              <TabsTrigger value="triggers" className="text-xs py-2 px-3 data-[state=active]:bg-muted rounded-b-none" data-testid="tab-admin-triggers">
                <ZapIcon className="w-3.5 h-3.5 mr-1.5" />
                Triggers
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
              <TabsContent value="users" className="mt-0">
                <AdminUsers />
              </TabsContent>
              <TabsContent value="prompts" className="mt-0">
                <AdminPrompts />
              </TabsContent>
              <TabsContent value="triggers" className="mt-0">
                <AdminTriggers />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
