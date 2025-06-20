"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Share,
  Calculator,
  FileSpreadsheet,
  FileText,
  Table,
  TrendingUp,
  BarChart3,
  CandlestickChartIcon as Candlestick,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentBond } from "@/lib/hooks/use-current-bond"
import { formatCurrency } from "@/lib/utils/format"
import { ExportService } from "@/lib/services/export.service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BondScheduleTable } from "./visualizations/bond-schedule-table"
import { BondLineChart } from "./visualizations/bond-line-chart"
import { BondCandlestickChart } from "./visualizations/bond-candlestick-chart"
import { BondComboChart } from "./visualizations/bond-combo-chart"
import { cn } from "@/lib/utils"

type ViewType = "table" | "line" | "candlestick" | "combo"

const viewOptions = [
  { id: "table", label: "Tabla", icon: Table, description: "Vista tabular detallada" },
  { id: "line", label: "Línea", icon: TrendingUp, description: "Flujos en el tiempo" },
  { id: "candlestick", label: "Velas", icon: Candlestick, description: "Análisis financiero" },
  { id: "combo", label: "Combinado", icon: BarChart3, description: "Barras + línea" },
] as const

function MetricsCard({
  title,
  value,
  description,
  className,
}: {
  title: string
  value: string | number
  description?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === "number"
            ? value.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : value}
        </div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </CardContent>
    </Card>
  )
}

function StructuringBlock() {
  const { calculationResult } = useCurrentBond()
  if (!calculationResult) return null

  const { constants } = calculationResult

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estructuración del Bono</CardTitle>
        <CardDescription>Constantes derivadas de los datos de entrada</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{constants.frecuenciaCupon}</div>
            <div className="text-sm text-gray-600">Frecuencia Cupón</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{constants.nPeriodosPorAnio}</div>
            <div className="text-sm text-gray-600">Nº Periodos/Año</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{constants.nTotalPeriodos}</div>
            <div className="text-sm text-gray-600">Nº Total Periodos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{constants.nPeriodosGracia}</div>
            <div className="text-sm text-gray-600">Nº Periodos Gracia</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{(constants.tasaEfectivaAnual * 100).toFixed(3)}%</div>
            <div className="text-sm text-gray-600">TEA</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {constants.tasaEfectivaPeriodo
                ? `${(constants.tasaEfectivaPeriodo * 100).toFixed(4)}%`
                : `${(constants.tasaEfectivaMensual * 100).toFixed(4)}%`}
            </div>
            <div className="text-sm text-gray-600">{constants.nombreTasaPeriodo || "TEM"}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(constants.costesInicialesEmisor, "PEN")}
            </div>
            <div className="text-sm text-gray-600">Costes Emisor</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(constants.costesInicialesBonista, "PEN")}
            </div>
            <div className="text-sm text-gray-600">Costes Bonista</div>
          </div>
        </div>

        {/* Información adicional sobre la tasa por período */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Tasa Efectiva por Período:</strong> {constants.nombreTasaPeriodo || "TEM"} =
            {constants.tasaEfectivaPeriodo
              ? ` ${(constants.tasaEfectivaPeriodo * 100).toFixed(6)}%`
              : ` ${(constants.tasaEfectivaMensual * 100).toFixed(6)}%`}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Calculada como: (1 + TEA)^(1/{constants.frecuenciaCupon}) - 1
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BondResults() {
  const router = useRouter()
  const { calculationResult, currentBond, mode } = useCurrentBond()
  const [currentView, setCurrentView] = useState<ViewType>("table")

  if (!calculationResult) {
    router.push("/dashboard")
    return null
  }

  const { metrics, input } = calculationResult

  const handleExportExcel = () => {
    if (calculationResult && currentBond) {
      ExportService.exportToExcel(calculationResult, currentBond.name)
    }
  }

  const handleExportDocumentation = () => {
    if (currentBond) {
      ExportService.exportDocumentation(currentBond.name)
    }
  }

  const renderVisualization = () => {
    switch (currentView) {
      case "table":
        return <BondScheduleTable />
      case "line":
        return <BondLineChart />
      case "candlestick":
        return <BondCandlestickChart />
      case "combo":
        return <BondComboChart />
      default:
        return <BondScheduleTable />
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {currentBond ? `Resultados: ${currentBond.name}` : "Resultados del Cálculo"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Análisis completo del bono calculado</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Share className="h-4 w-4 mr-2" />
            Compartir
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportExcel()}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar a Excel/CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportDocumentation()}>
                <FileText className="h-4 w-4 mr-2" />
                Documentación Completa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {currentBond && mode === "view" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push("/nuevo")
              }}
              className="w-full sm:w-auto"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          )}
        </div>
      </div>

      {/* Resto del contenido con grids responsive */}
      {/* 1. Estructuración del Bono */}
      <StructuringBlock />

      {/* 2. Precio Actual y Utilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Precio Actual y Utilidad</CardTitle>
          <CardDescription>Indicadores principales de valoración</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl sm:text-3xl font-bold text-blue-700">
                {formatCurrency(metrics.precioActual, "PEN")}
              </div>
              <div className="text-base sm:text-lg font-medium text-blue-600">Precio Actual</div>
              <div className="text-xs sm:text-sm text-gray-500">Suma de todos los flujos futuros</div>
            </div>
            <div
              className={`text-center p-4 sm:p-6 rounded-lg border ${
                metrics.utilidad >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div
                className={`text-2xl sm:text-3xl font-bold ${metrics.utilidad >= 0 ? "text-green-700" : "text-red-700"}`}
              >
                {formatCurrency(metrics.utilidad, "PEN")}
              </div>
              <div
                className={`text-base sm:text-lg font-medium ${metrics.utilidad >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {metrics.utilidad >= 0 ? "Utilidad" : "Pérdida"}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Precio actual + flujo inicial</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Ratios de decisión */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Ratios de Decisión</CardTitle>
          <CardDescription>Indicadores para análisis de riesgo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.duracion.toFixed(2)}</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Duración</div>
              <div className="text-xs text-gray-500">Sensibilidad a tasas</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.convexidad.toFixed(2)}</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Convexidad</div>
              <div className="text-xs text-gray-500">Curvatura precio-tasa</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.total.toFixed(2)}</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Total</div>
              <div className="text-xs text-gray-500">Duración + Convexidad</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.duracionModif.toFixed(2)}</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Duración Mod.</div>
              <div className="text-xs text-gray-500">Duración / (1 + kd)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Indicadores de Rentabilidad */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Rentabilidad</CardTitle>
          <CardDescription>Tasas internas de retorno efectivas anuales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{(metrics.tceaEmisor * 100).toFixed(5)}%</div>
              <div className="text-sm font-medium text-red-600">TCEA Emisor</div>
              <div className="text-xs text-gray-500">Tasa de costo efectiva anual para el emisor</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{(metrics.treaBonista * 100).toFixed(5)}%</div>
              <div className="text-sm font-medium text-green-600">TREA Bonista</div>
              <div className="text-xs text-gray-500">Tasa de rentabilidad efectiva anual para el bonista</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Visualización de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Análisis de Cronograma</CardTitle>
          <CardDescription>Diferentes vistas de los datos del cronograma</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Botones de Vista */}
          <div className="flex flex-wrap gap-2 mb-6">
            {viewOptions.map((option) => {
              const Icon = option.icon
              const isActive = currentView === option.id

              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView(option.id as ViewType)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4",
                    isActive && "bg-monetix-primary hover:bg-monetix-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Vista Actual */}
          <div className="min-h-[400px]">{renderVisualization()}</div>

          {/* Descripción de la vista actual */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{viewOptions.find((v) => v.id === currentView)?.label}:</strong>{" "}
              {viewOptions.find((v) => v.id === currentView)?.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
