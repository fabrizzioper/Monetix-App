"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Formik, Form, Field, ErrorMessage } from "formik"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/loading-spinner"
import { bondFormSchema } from "@/lib/validation/bond-form.schema"
import { BondsService } from "@/lib/services/bonds.service"
import { useCurrentBond } from "@/lib/hooks/use-current-bond"
import { useUserBonds } from "@/lib/hooks/use-user-bonds"
import { cn } from "@/lib/utils"

const defaultValues = {
  valorNominal: '',
  valorComercial: '',
  nAnios: '',
  frecuenciaCupon: '',
  diasPorAnio: '',
  tipoTasa: '',
  tasaInteres: '',
  tipoGracia: '',
  plazoGraciaAnio: '',
  pctEstruct: '',
  pctColoc: '',
  pctCavali: '',
  kd: '',
}

export function BondForm() {
  const router = useRouter()
  const { currentBond, mode, setCalculationResult } = useCurrentBond()
  const { createBond, updateBond } = useUserBonds()
  const [bondName, setBondName] = useState("")

  const initialValues = currentBond?.input || defaultValues

  useEffect(() => {
    if (currentBond && mode === "edit") {
      setBondName(currentBond.name)
    } else {
      setBondName("")
    }
  }, [currentBond, mode])

  const handleSubmit = async (values: any, actions: any) => {
    try {
      const bondInput = {
        ...values,
        diasPorAnio: values.diasPorAnio,
        kd: values.kd || undefined,
      }

      let result
      if (mode === "edit" && currentBond) {
        result = await updateBond(currentBond.id, {
          name: bondName || currentBond.name,
          input: bondInput,
        })
      } else {
        const name = bondName || `Bono ${new Date().toLocaleDateString("es-PE")}`
        result = await createBond(name, bondInput)
      }

      if (result) {
        const calculationResult = await BondsService.calculateBondPreview(bondInput)
        setCalculationResult(calculationResult)
        router.push("/resultado")
      }
    } catch (error) {
      console.error("Error al procesar el bono:", error)
      actions.setStatus("Error al procesar el bono")
    }
  }

  const handleSaveOnly = async (values: any) => {
    try {
      const bondInput = {
        ...values,
        diasPorAnio: values.diasPorAnio,
        kd: values.kd || undefined,
      }

      if (mode === "edit" && currentBond) {
        await updateBond(currentBond.id, {
          name: bondName || currentBond.name,
          input: bondInput,
        })
      } else {
        const name = bondName || `Bono ${new Date().toLocaleDateString("es-PE")}`
        await createBond(name, bondInput)
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Error al guardar el bono:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {mode === "edit" ? "Editar Bono" : "Nuevo Bono"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {mode === "edit" ? "Modifica los datos del bono" : "Complete los datos para crear el bono"}
            </p>
          </div>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Label htmlFor="bondName" className="text-sm font-medium text-gray-700">
              Nombre del Bono
            </Label>
            <Input
              id="bondName"
              value={bondName}
              onChange={(e) => setBondName(e.target.value)}
              placeholder="Ej: Bono Corporativo ABC"
              className="mt-2 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Formik initialValues={initialValues} validationSchema={bondFormSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values }) => (
          <Form className="space-y-6 relative">
            {isSubmitting && <LoadingOverlay text="Calculando..." />}
            {/* Sección Emisor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Sección Emisor</CardTitle>
                <CardDescription>Datos principales del instrumento financiero</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Todos los campos del formulario con responsive grid */}
                <div className="space-y-2">
                  <Label htmlFor="valorNominal" className="text-sm font-medium text-gray-700">
                    Valor Nominal
                  </Label>
                  <Field name="valorNominal">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="valorNominal"
                        type="number"
                        placeholder="515000000"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="valorNominal" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nAnios" className="text-sm font-medium text-gray-700">
                    Nº de Años
                  </Label>
                  <Field name="nAnios">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="nAnios"
                        type="number"
                        placeholder="8"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="nAnios" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frecuenciaCupon" className="text-sm font-medium text-gray-700">
                    Frecuencia del cupón
                  </Label>
                  <Field name="frecuenciaCupon">
                    {({ field, form, meta }: any) => (
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => form.setFieldValue("frecuenciaCupon", Number(value))}
                      >
                        <SelectTrigger className={cn("w-full", meta.touched && meta.error && "border-red-500")}>
                          <SelectValue placeholder="Seleccionar frecuencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Anual (1)</SelectItem>
                          <SelectItem value="2">Semestral (2)</SelectItem>
                          <SelectItem value="3">Cuatrimestral (3)</SelectItem>
                          <SelectItem value="4">Trimestral (4)</SelectItem>
                          <SelectItem value="6">Bimestral (6)</SelectItem>
                          <SelectItem value="12">Mensual (12)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage name="frecuenciaCupon" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diasPorAnio" className="text-sm font-medium text-gray-700">
                    Días × Año
                  </Label>
                  <Field name="diasPorAnio">
                    {({ field, form, meta }: any) => (
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => form.setFieldValue("diasPorAnio", Number(value))}
                      >
                        <SelectTrigger className={cn("w-full", meta.touched && meta.error && "border-red-500")}>
                          <SelectValue placeholder="Seleccionar convención" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="360">360 días</SelectItem>
                          <SelectItem value="365">365 días</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage name="diasPorAnio" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoTasa" className="text-sm font-medium text-gray-700">
                    Tipo de Tasa de Interés
                  </Label>
                  <Field name="tipoTasa">
                    {({ field, form, meta }: any) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => form.setFieldValue("tipoTasa", value)}
                      >
                        <SelectTrigger className={cn("w-full", meta.touched && meta.error && "border-red-500")}>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Efectiva">Efectiva</SelectItem>
                          <SelectItem value="Nominal">Nominal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage name="tipoTasa" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasaInteres" className="text-sm font-medium text-gray-700">
                    Tasa de interés (%)
                  </Label>
                  <Field name="tasaInteres">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="tasaInteres"
                        type="number"
                        step="0.001"
                        placeholder="7.375"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="tasaInteres" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoGracia" className="text-sm font-medium text-gray-700">
                    Tipo de Gracia
                  </Label>
                  <Field name="tipoGracia">
                    {({ field, form, meta }: any) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => form.setFieldValue("tipoGracia", value)}
                      >
                        <SelectTrigger className={cn("w-full", meta.touched && meta.error && "border-red-500")}>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ninguna">Ninguna</SelectItem>
                          <SelectItem value="Parcial">Parcial</SelectItem>
                          <SelectItem value="Total">Total</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage name="tipoGracia" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plazoGraciaAnio" className="text-sm font-medium text-gray-700">
                    Plazo de Gracia (año)
                  </Label>
                  <Field name="plazoGraciaAnio">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="plazoGraciaAnio"
                        type="number"
                        placeholder="4"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="plazoGraciaAnio" component="p" className="text-xs text-red-600" />
                </div>

                {/* Campo autocalculado: Nº de Periodos de Gracia */}
                <div className="space-y-2">
                  <Label htmlFor="nPeriodosGracia" className="text-sm font-medium text-gray-700">
                    Nº de Periodos de Gracia
                  </Label>
                  <Input
                    id="nPeriodosGracia"
                    type="number"
                    value={values.plazoGraciaAnio ? 2 * Number(values.plazoGraciaAnio) : 0}
                    readOnly
                    disabled
                    className="w-full bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Costes Iniciales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Costes Iniciales (%)</CardTitle>
                <CardDescription>Porcentajes sobre el valor nominal</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pctEstruct" className="text-sm font-medium text-gray-700">
                    % Estructuración
                  </Label>
                  <Field name="pctEstruct">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="pctEstruct"
                        type="number"
                        step="0.01"
                        placeholder="0.45"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="pctEstruct" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pctColoc" className="text-sm font-medium text-gray-700">
                    % Colocación
                  </Label>
                  <Field name="pctColoc">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="pctColoc"
                        type="number"
                        step="0.01"
                        placeholder="0.25"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="pctColoc" component="p" className="text-xs text-red-600" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pctCavali" className="text-sm font-medium text-gray-700">
                    % CAVALI
                  </Label>
                  <Field name="pctCavali">
                    {({ field, meta }: any) => (
                      <Input
                        {...field}
                        id="pctCavali"
                        type="number"
                        step="0.01"
                        placeholder="0.5"
                        className={cn("w-full", meta.touched && meta.error && "border-red-500")}
                        value={field.value ?? ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="pctCavali" component="p" className="text-xs text-red-600" />
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveOnly(values)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Solo Guardar
              </Button>

              <Button
                type="submit"
                className="bg-monetix-primary hover:bg-monetix-secondary text-white w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Calculando...
                  </div>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
