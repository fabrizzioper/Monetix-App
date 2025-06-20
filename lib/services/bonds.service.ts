import type { BondRecord, BondInput } from "@/lib/types/database"
import type { BondCalculationResult } from "@/lib/types/bond-calculations"
import { databaseService } from "./database.service"
import { calculateBond } from "./bond-calculations.service"

export class BondsService {
  static async getUserBonds(userId: string): Promise<BondRecord[]> {
    return await databaseService.getBondsByUserId(userId)
  }

  static async getBond(bondId: string, userId: string): Promise<BondRecord | null> {
    return await databaseService.getBondById(bondId, userId)
  }

  static async createBond(userId: string, name: string, input: BondInput): Promise<BondRecord> {
    return await databaseService.createBond(userId, { name, input })
  }

  static async updateBond(
    bondId: string,
    userId: string,
    updates: { name?: string; input?: BondInput },
  ): Promise<BondRecord | null> {
    return await databaseService.updateBond(bondId, userId, updates)
  }

  static async deleteBond(bondId: string, userId: string): Promise<boolean> {
    return await databaseService.deleteBond(bondId, userId)
  }

  static async calculateAndSaveBond(bondId: string, userId: string): Promise<BondCalculationResult | null> {
    const bond = await databaseService.getBondById(bondId, userId)
    if (!bond) return null

    const result = calculateBond(bond.input, bond.name)

    await databaseService.saveBondCalculation(bondId, userId, {
      metrics: result.metrics,
      schedule: result.schedule,
    })

    return result
  }

  static async calculateBondPreview(input: BondInput, bondName = "Vista Previa"): Promise<BondCalculationResult> {
    return calculateBond(input, bondName)
  }
}
