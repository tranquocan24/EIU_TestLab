# Kế Hoạch Triển Khai System Monitoring - EIU TestLab Admin Dashboard

## 📊 Tổng Quan
Tài liệu này mô tả chi tiết các bước để implement hệ thống monitoring với các metrics: **RPM (Requests Per Minute)** và **CPU & RAM Usage** cho Admin Dashboard.

---

## 🎯 Mục Tiêu

### Chức năng cần triển khai:
1. **RPM (Requests Per Minute)**: Theo dõi số lượng request đến server mỗi phút
2. **CPU Usage**: Hiển thị % sử dụng CPU của server
3. **RAM Usage**: Hiển thị % sử dụng RAM của server
4. **Real-time Dashboard**: Cập nhật metrics theo thời gian thực

### 💾 Nơi Lưu Trữ Dữ Liệu:

#### **In-Memory Storage (Default Implementation)**
Dữ liệu monitoring được lưu trữ trong **bộ nhớ RAM của server** (không dùng database):

1. **RPM Data**:
   - Lưu trữ: `Map<string, number[]>` trong `RequestTrackerMiddleware`
   - Vị trí: `backend/src/common/middleware/request-tracker.middleware.ts`
   - Dung lượng: ~10 phút lịch sử (timestamps của requests)
   - Cleanup: Tự động xóa data cũ hơn 10 phút

2. **CPU Usage History**:
   - Lưu trữ: `Array<{ time: Date; usage: number }>` trong `MonitoringService`
   - Vị trí: `backend/src/modules/monitoring/monitoring.service.ts`
   - Dung lượng: Giới hạn 100 điểm (MAX_HISTORY_SIZE)
   - Cleanup: FIFO (xóa điểm cũ nhất khi đạt limit)

3. **RAM Usage History**:
   - Lưu trữ: `Array<{ time: Date; usage: number }>` trong `MonitoringService`
   - Vị trí: `backend/src/modules/monitoring/monitoring.service.ts`
   - Dung lượng: Giới hạn 100 điểm (MAX_HISTORY_SIZE)
   - Cleanup: FIFO (xóa điểm cũ nhất khi đạt limit)

#### **⚠️ Lưu Ý Quan Trọng:**

**Ưu điểm của In-Memory Storage:**
- ⚡ Cực kỳ nhanh (microseconds access time)
- 🚀 Không cần setup database
- 💰 Không tốn storage cost
- 🔧 Đơn giản, dễ implement
- 📊 Phù hợp cho real-time monitoring

**Nhược điểm:**
- ❌ **Mất data khi restart server** (không persist)
- ❌ Không thể xem lịch sử lâu dài (chỉ giữ 10-20 phút)
- ❌ Không scale được với nhiều server instances
- ❌ Không thể analytics/reporting dài hạn

#### **🗄️ Optional: Database Storage (Mở Rộng Sau)**

Nếu cần lưu trữ lâu dài, có thể implement thêm:

**Option 1: PostgreSQL (Current Database)**
```typescript
// Model Prisma Schema
model MonitoringMetric {
  id        Int      @id @default(autoincrement())
  type      String   // 'rpm', 'cpu', 'memory'
  value     Float
  timestamp DateTime @default(now())
  metadata  Json?    // Additional data
  
  @@index([type, timestamp])
}
```

**Option 2: Time-Series Database (Recommended cho Production)**
- **InfluxDB**: Tối ưu cho time-series data
- **Prometheus + Grafana**: Industry standard cho monitoring
- **TimescaleDB**: PostgreSQL extension cho time-series

**Option 3: Redis (Hybrid Approach)**
- Lưu short-term data (1-24 giờ)
- Faster than PostgreSQL
- Auto-expiration với TTL

#### **📊 Data Retention Policy:**

**Current Implementation (In-Memory):**
- RPM: 10 phút
- CPU History: 100 điểm (~3-5 phút với interval 2s)
- RAM History: 100 điểm (~3-5 phút với interval 2s)

**Recommended cho Production (với Database):**
- Real-time data: 15 phút (in-memory)
- Short-term: 24 giờ (detailed data)
- Medium-term: 7 ngày (aggregated hourly)
- Long-term: 90 ngày (aggregated daily)
- Archive: > 90 ngày (export to cold storage)

---

## 🔧 Tech Stack cho Monitoring

### Backend Libraries
- `@nestjs/throttler` - Rate limiting và request tracking
- `systeminformation` - Thu thập CPU/RAM usage (Node.js)
- `os` (built-in) - Thông tin hệ thống cơ bản
- `express-status-monitor` (optional) - Real-time monitoring middleware

### Frontend Libraries
- `recharts` hoặc `chart.js` - Vẽ biểu đồ
- `react-chartjs-2` - React wrapper cho Chart.js
- `date-fns` - Xử lý thời gian
- Socket.IO client - Real-time updates

---

## 📋 PHASE 1: BACKEND - REQUEST TRACKING (RPM)

### Step 1.1: Cài đặt dependencies
```bash
cd backend
npm install systeminformation
npm install @nestjs/throttler
npm install express
```

### Step 1.2: Tạo Monitoring Module
- [ ] Tạo file: `backend/src/modules/monitoring/monitoring.module.ts`
- [ ] Tạo file: `backend/src/modules/monitoring/monitoring.service.ts`
- [ ] Tạo file: `backend/src/modules/monitoring/monitoring.controller.ts`
- [ ] Tạo file: `backend/src/modules/monitoring/dto/system-metrics.dto.ts`

### Step 1.3: Tạo Middleware để track requests

**File: `backend/src/common/middleware/request-tracker.middleware.ts`**

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestTrackerMiddleware implements NestMiddleware {
  private requestCounts: Map<string, number[]> = new Map();
  private readonly WINDOW_SIZE_MS = 60000; // 1 phút

  use(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const minute = Math.floor(now / this.WINDOW_SIZE_MS);
    const key = `rpm_${minute}`;
    
    // Lưu timestamp của request
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }
    this.requestCounts.get(key).push(now);
    
    // Cleanup old data (giữ lại 10 phút gần nhất)
    this.cleanupOldData(minute);
    
    next();
  }

  private cleanupOldData(currentMinute: number) {
    const keysToDelete = [];
    for (const [key] of this.requestCounts) {
      const minute = Number.parseInt(key.split('_')[1]);
      if (currentMinute - minute > 10) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.requestCounts.delete(key));
  }

  getRPM(): number {
    const now = Date.now();
    const currentMinute = Math.floor(now / this.WINDOW_SIZE_MS);
    const key = `rpm_${currentMinute}`;
    return this.requestCounts.get(key)?.length || 0;
  }

  getRPMHistory(minutes: number = 10): { time: string; rpm: number }[] {
    const now = Date.now();
    const currentMinute = Math.floor(now / this.WINDOW_SIZE_MS);
    const history = [];
    
    for (let i = minutes - 1; i >= 0; i--) {
      const minute = currentMinute - i;
      const key = `rpm_${minute}`;
      const rpm = this.requestCounts.get(key)?.length || 0;
      const timestamp = minute * this.WINDOW_SIZE_MS;
      history.push({
        time: new Date(timestamp).toISOString(),
        rpm
      });
    }
    
    return history;
  }
}
```

**Checklist:**
- [ ] Tạo middleware file
- [ ] Implement request counting logic
- [ ] Implement cleanup mechanism
- [ ] Implement getRPM() method
- [ ] Implement getRPMHistory() method

### Step 1.4: Đăng ký Middleware trong main.ts

**File: `backend/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestTrackerMiddleware } from './common/middleware/request-tracker.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Apply Request Tracker Middleware globally
  const requestTracker = new RequestTrackerMiddleware();
  app.use(requestTracker.use.bind(requestTracker));
  
  // Store reference for MonitoringService
  app.set('requestTracker', requestTracker);
  
  await app.listen(3000);
}
bootstrap();
```

**Checklist:**
- [ ] Import RequestTrackerMiddleware
- [ ] Apply middleware globally
- [ ] Store reference trong app instance

---

## 📋 PHASE 2: BACKEND - CPU & RAM MONITORING

### Step 2.1: Tạo MonitoringService

**File: `backend/src/modules/monitoring/monitoring.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as si from 'systeminformation';

@Injectable()
export class MonitoringService {
  private cpuHistory: { time: Date; usage: number }[] = [];
  private memoryHistory: { time: Date; usage: number }[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  async getSystemMetrics() {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    
    // Lưu vào history
    this.cpuHistory.push({ time: new Date(), usage: cpuUsage });
    this.memoryHistory.push({ time: new Date(), usage: memoryUsage });
    
    // Giới hạn history size
    if (this.cpuHistory.length > this.MAX_HISTORY_SIZE) {
      this.cpuHistory.shift();
    }
    if (this.memoryHistory.length > this.MAX_HISTORY_SIZE) {
      this.memoryHistory.shift();
    }
    
    return {
      cpu: {
        current: cpuUsage,
        history: this.cpuHistory.slice(-20) // 20 điểm gần nhất
      },
      memory: {
        current: memoryUsage,
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        history: this.memoryHistory.slice(-20)
      },
      uptime: os.uptime(),
      platform: os.platform(),
      nodeVersion: process.version
    };
  }

  async getCPUUsage(): Promise<number> {
    try {
      const cpuData = await si.currentLoad();
      return Math.round(cpuData.currentLoad);
    } catch (error) {
      // Fallback to os module
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - Math.floor((idle / total) * 100);
      
      return usage;
    }
  }

  async getMemoryUsage(): Promise<number> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;
    return Math.round(memoryUsagePercent);
  }

  async getDetailedSystemInfo() {
    try {
      const [cpu, mem, osInfo, processes] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.processes()
      ]);
      
      return {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          speed: cpu.speed
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active,
          available: mem.available
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch
        },
        processes: {
          all: processes.all,
          running: processes.running,
          blocked: processes.blocked
        }
      };
    } catch (error) {
      return {
        error: 'Unable to fetch detailed system info',
        message: error.message
      };
    }
  }

  getCPUHistory() {
    return this.cpuHistory;
  }

  getMemoryHistory() {
    return this.memoryHistory;
  }
}
```

**Checklist:**
- [ ] Implement getSystemMetrics()
- [ ] Implement getCPUUsage()
- [ ] Implement getMemoryUsage()
- [ ] Implement history tracking
- [ ] Implement getDetailedSystemInfo()
- [ ] Handle errors properly

### Step 2.2: Tạo MonitoringController

**File: `backend/src/modules/monitoring/monitoring.controller.ts`**

```typescript
import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { REQUEST } from '@nestjs/core';

@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    @Inject(REQUEST) private readonly request: any
  ) {}

  @Get('system')
  async getSystemMetrics() {
    const metrics = await this.monitoringService.getSystemMetrics();
    
    // Get RPM from request tracker
    const requestTracker = this.request.app.get('requestTracker');
    const rpm = requestTracker ? requestTracker.getRPM() : 0;
    const rpmHistory = requestTracker ? requestTracker.getRPMHistory(20) : [];
    
    return {
      ...metrics,
      requests: {
        rpm,
        history: rpmHistory
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('rpm')
  async getRPM() {
    const requestTracker = this.request.app.get('requestTracker');
    return {
      current: requestTracker ? requestTracker.getRPM() : 0,
      history: requestTracker ? requestTracker.getRPMHistory(60) : []
    };
  }

  @Get('cpu')
  async getCPU() {
    const usage = await this.monitoringService.getCPUUsage();
    return {
      current: usage,
      history: this.monitoringService.getCPUHistory()
    };
  }

  @Get('memory')
  async getMemory() {
    const usage = await this.monitoringService.getMemoryUsage();
    return {
      current: usage,
      history: this.monitoringService.getMemoryHistory(),
      details: {
        total: Math.round(require('os').totalmem() / (1024 * 1024 * 1024)),
        free: Math.round(require('os').freemem() / (1024 * 1024 * 1024)),
        used: Math.round((require('os').totalmem() - require('os').freemem()) / (1024 * 1024 * 1024))
      }
    };
  }

  @Get('details')
  async getDetailedInfo() {
    return this.monitoringService.getDetailedSystemInfo();
  }
}
```

**Checklist:**
- [ ] Create controller file
- [ ] Implement getSystemMetrics() endpoint
- [ ] Implement getRPM() endpoint
- [ ] Implement getCPU() endpoint
- [ ] Implement getMemory() endpoint
- [ ] Implement getDetailedInfo() endpoint
- [ ] Add proper guards (Admin only)

### Step 2.3: Tạo MonitoringModule

**File: `backend/src/modules/monitoring/monitoring.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService]
})
export class MonitoringModule {}
```

**Checklist:**
- [ ] Create module file
- [ ] Register controller
- [ ] Register service
- [ ] Export service

### Step 2.4: Đăng ký MonitoringModule trong AppModule

**File: `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
// ... other imports

@Module({
  imports: [
    // ... other modules
    MonitoringModule,
  ],
  // ...
})
export class AppModule {}
```

**Checklist:**
- [ ] Import MonitoringModule
- [ ] Add to imports array

---

## 📋 PHASE 3: BACKEND - REAL-TIME UPDATES VIA WEBSOCKET

### Step 3.1: Tạo Monitoring Gateway

**File: `backend/src/modules/monitoring/monitoring.gateway.ts`**

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MonitoringService } from './monitoring.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'monitoring',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private updateInterval: NodeJS.Timeout;
  private connectedClients = 0;

  constructor(private readonly monitoringService: MonitoringService) {}

  handleConnection(client: Socket) {
    console.log(`Monitoring client connected: ${client.id}`);
    this.connectedClients++;

    // Start broadcasting if this is the first client
    if (this.connectedClients === 1) {
      this.startBroadcasting();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Monitoring client disconnected: ${client.id}`);
    this.connectedClients--;

    // Stop broadcasting if no clients connected
    if (this.connectedClients === 0) {
      this.stopBroadcasting();
    }
  }

  private startBroadcasting() {
    // Broadcast metrics every 2 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const metrics = await this.monitoringService.getSystemMetrics();
        
        // Get RPM data (you'll need to access RequestTracker here)
        // For now, we'll emit without RPM data
        
        this.server.emit('metrics-update', {
          ...metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error broadcasting metrics:', error);
      }
    }, 2000);
  }

  private stopBroadcasting() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
```

**Checklist:**
- [ ] Create gateway file
- [ ] Implement connection handling
- [ ] Implement broadcasting mechanism
- [ ] Emit metrics every 2 seconds
- [ ] Handle client disconnect
- [ ] Stop broadcasting when no clients

### Step 3.2: Update MonitoringModule

```typescript
import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringGateway } from './monitoring.gateway';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringGateway],
  exports: [MonitoringService]
})
export class MonitoringModule {}
```

**Checklist:**
- [ ] Add MonitoringGateway to providers

---

## 📋 PHASE 4: FRONTEND - MONITORING DASHBOARD

### Step 4.1: Cài đặt Frontend Dependencies

```bash
cd frontend
npm install recharts
npm install socket.io-client
npm install date-fns
```

### Step 4.2: Tạo Monitoring Hook

**File: `frontend/src/hooks/useMonitoring.ts`**

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SystemMetrics {
  cpu: {
    current: number;
    history: { time: Date; usage: number }[];
  };
  memory: {
    current: number;
    total: number;
    free: number;
    used: number;
    history: { time: Date; usage: number }[];
  };
  requests: {
    rpm: number;
    history: { time: string; rpm: number }[];
  };
  uptime: number;
  platform: string;
  nodeVersion: string;
  timestamp: string;
}

export function useMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to monitoring namespace
    const newSocket = io('http://localhost:3000/monitoring', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to monitoring socket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from monitoring socket');
      setIsConnected(false);
    });

    newSocket.on('metrics-update', (data: SystemMetrics) => {
      setMetrics(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { metrics, isConnected, socket };
}
```

**Checklist:**
- [ ] Create hook file
- [ ] Implement socket connection
- [ ] Handle metrics updates
- [ ] Handle connection status
- [ ] Cleanup on unmount

### Step 4.3: Tạo Monitoring Components

**File: `frontend/src/components/admin/SystemMetricsCard.tsx`**

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Cpu, MemoryStick, TrendingUp } from 'lucide-react';

interface SystemMetricsCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'danger';
  subtitle?: string;
}

export function SystemMetricsCard({
  title,
  value,
  unit,
  icon,
  status,
  subtitle
}: SystemMetricsCardProps) {
  const statusColors = {
    normal: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500'
  };

  const bgColors = {
    normal: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${bgColors[status]} p-2 rounded-full`}>
          <div className={statusColors[status]}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(1)}
          <span className="text-sm font-normal ml-1">{unit}</span>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**File: `frontend/src/components/admin/MetricsChart.tsx`**

```typescript
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface MetricsChartProps {
  title: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  yAxisLabel: string;
  color: string;
}

export function MetricsChart({
  title,
  data,
  dataKey,
  xAxisKey,
  yAxisLabel,
  color
}: MetricsChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={(value) => {
                try {
                  return format(new Date(value), 'HH:mm:ss');
                } catch {
                  return value;
                }
              }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={(value) => {
                try {
                  return format(new Date(value), 'HH:mm:ss');
                } catch {
                  return value;
                }
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Checklist:**
- [ ] Create SystemMetricsCard component
- [ ] Create MetricsChart component
- [ ] Add proper styling
- [ ] Handle status colors

### Step 4.4: Tạo Admin Monitoring Dashboard Page

**File: `frontend/src/app/(dashboard)/admin/monitoring/page.tsx`**

```typescript
'use client';

import React from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';
import { SystemMetricsCard } from '@/components/admin/SystemMetricsCard';
import { MetricsChart } from '@/components/admin/MetricsChart';
import { Activity, Cpu, MemoryStick, TrendingUp, Circle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MonitoringPage() {
  const { metrics, isConnected } = useMonitoring();

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-pulse mx-auto mb-4" />
            <p>Loading system metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatus = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'danger';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="flex items-center gap-2">
          <Circle
            className={`w-3 h-3 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Alert for high load */}
      {(metrics.cpu.current > 80 || metrics.memory.current > 80) && (
        <Alert variant="destructive">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            High system load detected! Server may be under heavy load.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SystemMetricsCard
          title="Requests Per Minute"
          value={metrics.requests.rpm}
          unit="req/min"
          icon={<TrendingUp className="h-4 w-4" />}
          status={getStatus(metrics.requests.rpm, { warning: 100, danger: 200 })}
          subtitle="Current request rate"
        />

        <SystemMetricsCard
          title="CPU Usage"
          value={metrics.cpu.current}
          unit="%"
          icon={<Cpu className="h-4 w-4" />}
          status={getStatus(metrics.cpu.current, { warning: 70, danger: 85 })}
          subtitle="Processor utilization"
        />

        <SystemMetricsCard
          title="Memory Usage"
          value={metrics.memory.current}
          unit="%"
          icon={<MemoryStick className="h-4 w-4" />}
          status={getStatus(metrics.memory.current, { warning: 75, danger: 90 })}
          subtitle={`${(metrics.memory.used / (1024 * 1024 * 1024)).toFixed(1)} GB / ${(metrics.memory.total / (1024 * 1024 * 1024)).toFixed(1)} GB`}
        />

        <SystemMetricsCard
          title="System Uptime"
          value={Math.floor(metrics.uptime / 3600)}
          unit="hours"
          icon={<Activity className="h-4 w-4" />}
          status="normal"
          subtitle={`Platform: ${metrics.platform}`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-1">
        <MetricsChart
          title="Requests Per Minute (Last 20 minutes)"
          data={metrics.requests.history}
          dataKey="rpm"
          xAxisKey="time"
          yAxisLabel="Requests"
          color="#8884d8"
        />

        <MetricsChart
          title="CPU Usage History"
          data={metrics.cpu.history}
          dataKey="usage"
          xAxisKey="time"
          yAxisLabel="CPU %"
          color="#82ca9d"
        />

        <MetricsChart
          title="Memory Usage History"
          data={metrics.memory.history}
          dataKey="usage"
          xAxisKey="time"
          yAxisLabel="Memory %"
          color="#ffc658"
        />
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Create monitoring page
- [ ] Display metrics cards
- [ ] Display charts
- [ ] Show connection status
- [ ] Add alerts for high load
- [ ] Format data properly

### Step 4.5: Thêm Link vào Admin Navigation

**File: `frontend/src/components/navbar.tsx` (hoặc admin sidebar)**

```typescript
// Thêm link mới
<Link href="/admin/monitoring" className="...">
  <Activity className="mr-2 h-4 w-4" />
  System Monitoring
</Link>
```

**Checklist:**
- [ ] Add monitoring link to navigation
- [ ] Add icon
- [ ] Test navigation

---

## 📋 PHASE 5: TESTING & OPTIMIZATION

### Step 5.1: Testing Backend

- [ ] Test `/monitoring/system` endpoint
- [ ] Test `/monitoring/rpm` endpoint
- [ ] Test `/monitoring/cpu` endpoint
- [ ] Test `/monitoring/memory` endpoint
- [ ] Test WebSocket connection
- [ ] Test với nhiều concurrent requests
- [ ] Verify RPM counting accuracy
- [ ] Verify CPU/RAM readings

### Step 5.2: Testing Frontend

- [ ] Test dashboard renders correctly
- [ ] Test real-time updates
- [ ] Test charts display properly
- [ ] Test responsive design
- [ ] Test với nhiều tabs/windows
- [ ] Test reconnection khi mất kết nối
- [ ] Verify status colors thresholds

### Step 5.3: Performance Optimization

- [ ] Optimize history data size (giới hạn số lượng points)
- [ ] Add throttling cho updates (không quá frequent)
- [ ] Cleanup old data periodically
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Optimize chart rendering
- [ ] Consider using React.memo cho components

### Step 5.4: Security

- [ ] Ensure chỉ Admin có thể access
- [ ] Validate JWT tokens
- [ ] Add rate limiting cho monitoring endpoints
- [ ] Sanitize data trước khi gửi
- [ ] Add CORS configuration properly

---

## 📋 PHASE 6: DEPLOYMENT & DOCUMENTATION

### Step 6.1: Environment Configuration

**File: `backend/.env`**
```env
# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_UPDATE_INTERVAL=2000
MONITORING_HISTORY_SIZE=100
```

**Checklist:**
- [ ] Add environment variables
- [ ] Document environment config
- [ ] Update .env.example

### Step 6.2: Documentation

- [ ] API documentation cho monitoring endpoints
- [ ] WebSocket events documentation
- [ ] Admin user guide
- [ ] Troubleshooting guide
- [ ] Performance thresholds explanation

### Step 6.3: Deployment

- [ ] Build backend
- [ ] Build frontend
- [ ] Test trên staging environment
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify real-time updates work

---

## 🎯 Success Criteria

### Functional Requirements
✅ RPM tracking với độ chính xác cao
✅ CPU usage monitoring real-time
✅ RAM usage monitoring real-time
✅ WebSocket real-time updates (2s interval)
✅ Historical data charts
✅ Admin-only access
✅ Responsive dashboard

### Performance Requirements
✅ Updates mỗi 2 giây không ảnh hưởng performance
✅ History data không vượt quá 100 points
✅ WebSocket connection stable
✅ Charts render smoothly

### Security Requirements
✅ JWT authentication required
✅ Role-based access (Admin only)
✅ CORS properly configured
✅ No sensitive data exposed

---

## 📊 Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| Phase 1 | Request Tracking (RPM) | 3-4 hours |
| Phase 2 | CPU & RAM Monitoring | 3-4 hours |
| Phase 3 | WebSocket Real-time | 2-3 hours |
| Phase 4 | Frontend Dashboard | 4-5 hours |
| Phase 5 | Testing & Optimization | 2-3 hours |
| Phase 6 | Documentation & Deployment | 1-2 hours |
| **Total** | | **15-21 hours** |

---

## 🔧 Troubleshooting

### Issue: RPM không đếm chính xác
- Kiểm tra middleware có apply globally không
- Verify request timestamps
- Check cleanup logic

### Issue: CPU/RAM readings không chính xác
- Kiểm tra systeminformation package
- Fallback to os module
- Test trên môi trường khác

### Issue: WebSocket không connect
- Check CORS configuration
- Verify Socket.IO server setup
- Check client connection URL
- Verify port not blocked

### Issue: Charts không render
- Check data format
- Verify recharts installation
- Check console for errors
- Verify date formatting

---

**Last Updated:** December 21, 2025
**Project:** EIU TestLab - System Monitoring Feature
**Status:** Ready for Implementation
