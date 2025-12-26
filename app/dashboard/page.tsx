import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr] md:p-8">
        <aside className="bg-card/40 rounded-lg border p-3 md:p-4">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="bg-primary/10 size-6 rounded-md" />
            <span className="font-semibold">Acme Inc.</span>
          </div>
          <Separator className="my-3" />
          <nav className="grid gap-1">
            <Button variant="secondary" className="justify-start">
              Quick Create
            </Button>
            <Button variant="ghost" className="justify-start">
              Dashboard
            </Button>
            <Button variant="ghost" className="justify-start">
              Lifecycle
            </Button>
            <Button variant="ghost" className="justify-start">
              Analytics
            </Button>
            <Button variant="ghost" className="justify-start">
              Projects
            </Button>
            <Button variant="ghost" className="justify-start">
              Team
            </Button>
          </nav>
          <Separator className="my-3" />
          <div className="space-y-1">
            <div className="text-muted-foreground px-2 text-xs font-medium">
              Documents
            </div>
            <Button variant="ghost" className="justify-start">
              Data Library
            </Button>
            <Button variant="ghost" className="justify-start">
              Reports
            </Button>
            <Button variant="ghost" className="justify-start">
              Word Assistant
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="space-y-1">
            <Button variant="ghost" className="justify-start">
              Settings
            </Button>
            <Button variant="ghost" className="justify-start">
              Get Help
            </Button>
            <Button variant="ghost" className="justify-start">
              Search
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-6">
          <header className="bg-card/50 flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span className="inline-flex size-5 items-center justify-center rounded border">
                ▢
              </span>
              <span>Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary">GitHub</Button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              trend="Trending up this month"
              delta="+12.5%"
            >
              <div className="text-3xl font-bold">$1,250.00</div>
              <div className="text-muted-foreground text-xs">
                Visitors for the last 6 months
              </div>
            </MetricCard>
            <MetricCard
              title="New Customers"
              trend="Down 20% this period"
              delta="-20%"
            >
              <div className="text-3xl font-bold">1,234</div>
              <div className="text-muted-foreground text-xs">
                Acquisition needs attention
              </div>
            </MetricCard>
            <MetricCard
              title="Active Accounts"
              trend="Strong user retention"
              delta="+12.5%"
            >
              <div className="text-3xl font-bold">45,678</div>
              <div className="text-muted-foreground text-xs">
                Engagement exceed targets
              </div>
            </MetricCard>
            <MetricCard
              title="Growth Rate"
              trend="Steady performance increase"
              delta="+4.5%"
            >
              <div className="text-3xl font-bold">4.5%</div>
              <div className="text-muted-foreground text-xs">
                Meets growth projections
              </div>
            </MetricCard>
          </section>

          <section className="space-y-3">
            <Card className="bg-card/50 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Total Visitors</div>
                  <div className="text-muted-foreground text-xs">
                    Total for the last 3 months
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    Last 3 months
                  </Button>
                  <Button size="sm" variant="ghost">
                    Last 30 days
                  </Button>
                  <Button size="sm" variant="ghost">
                    Last 7 days
                  </Button>
                </div>
              </div>
              <div className="bg-muted/30 relative h-56 w-full rounded-md border">
                <ChartPlaceholder />
              </div>
            </Card>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Outline</Badge>
                <Badge variant="outline">Past Performance</Badge>
                <Badge variant="outline">Key Personnel</Badge>
                <Badge variant="outline">Focus Documents</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Customize Columns
                </Button>
                <Button size="sm">Add Section</Button>
              </div>
            </div>

            <Card className="bg-card/50 overflow-hidden rounded-lg border">
              <div className="text-muted-foreground grid grid-cols-[1fr_180px_160px_120px_1fr_40px] gap-4 border-b px-4 py-3 text-xs">
                <div>Header</div>
                <div>Section Type</div>
                <div>Status</div>
                <div>Target</div>
                <div>Reviewer</div>
                <div></div>
              </div>
              <div className="divide-y">
                <Row
                  title="Cover page"
                  type="Cover page"
                  status="In Process"
                  target="18/5"
                  reviewer="Eddie Lake"
                />
                <Row
                  title="Table of contents"
                  type="Table of contents"
                  status="Done"
                  target="29/24"
                  reviewer="Eddie Lake"
                />
                <Row
                  title="Executive summary"
                  type="Narrative"
                  status="Done"
                  target="10/13"
                  reviewer="Eddie Lake"
                />
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  trend,
  delta,
  children,
}: {
  title: string;
  trend: string;
  delta: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50 rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">{title}</div>
        <Badge
          variant={delta.startsWith('-') ? 'destructive' : 'secondary'}
          className={cn(
            'font-normal',
            delta.startsWith('-') &&
              'bg-destructive/20 text-destructive-foreground border-destructive/30'
          )}
        >
          {delta}
        </Badge>
      </div>
      <div className="space-y-1">
        {children}
        <div className="text-muted-foreground text-xs">{trend}</div>
      </div>
    </Card>
  );
}

function ChartPlaceholder() {
  return (
    <svg viewBox="0 0 400 160" className="size-full">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      >
        <path
          d="M0 120 C 40 80, 80 140, 120 110 C 160 80, 200 140, 240 110 C 280 80, 320 140, 360 110 C 380 100, 400 120, 400 120"
          fill="url(#g)"
        />
        <path
          d="M0 135 C 40 95, 80 155, 120 125 C 160 95, 200 155, 240 125 C 280 95, 320 155, 360 125 C 380 115, 400 135, 400 135"
          opacity="0.55"
        />
      </g>
      <g stroke="currentColor" className="text-border" opacity="0.35">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={(i + 1) * 44} x2={(i + 1) * 44} y1="16" y2="144" />
        ))}
      </g>
    </svg>
  );
}

function Row({
  title,
  type,
  status,
  target,
  reviewer,
}: {
  title: string;
  type: string;
  status: string;
  target: string;
  reviewer: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_180px_160px_120px_1fr_40px] items-center gap-4 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground cursor-grab">⋮⋮</span>
        <span className="truncate font-medium">{title}</span>
      </div>
      <div className="text-muted-foreground truncate">{type}</div>
      <div>
        <Badge variant={status === 'Done' ? 'secondary' : 'outline'}>
          {status}
        </Badge>
      </div>
      <div className="text-muted-foreground">{target}</div>
      <div className="truncate">{reviewer}</div>
      <div className="text-muted-foreground">⋯</div>
    </div>
  );
}
