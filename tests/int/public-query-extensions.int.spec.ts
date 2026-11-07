import { describe,it,expect,vi } from 'vitest'
const { rows }=vi.hoisted(()=>({rows:Array.from({length:225},(_,index)=>({metadata:{stockId:`row-${index}`,lastUpdated:'2026-11-01'},vehicle:{make:'Ford',model:'Focus',colour:index===224?'Green':'Red',derivative:index===224?'50% special':'Standard',registration:`AB${index}`,yearOfManufacture:2023,odometerReadingMiles:index},adverts:{retailAdverts:{totalPrice:{amountGBP:10000+index}}}}))}))
vi.mock('@/utilities/vehicleInventory',()=>({getInventory:async()=>rows}))
import { queryListings } from '@/lib/services/publicListings'
describe('Template 8 complete-stock search and colour',()=>{
 it('filters colour across the complete inventory before taking page one',async()=>{const result=await queryListings(new URLSearchParams({colour:'Green',pageSize:'20'}));expect(result.totalResults).toBe(1);expect(result.results[0].metadata.stockId).toBe('row-224')})
 it('searches derivative and literal percent on cars beyond the first page',async()=>{const result=await queryListings(new URLSearchParams({search:'50%'}));expect(result.totalResults).toBe(1);expect(result.results[0].metadata.stockId).toBe('row-224')})
 it('bounds additional public query strings',async()=>{await expect(queryListings(new URLSearchParams({colour:'x'.repeat(101)}))).rejects.toThrow('Filter too long')})
})
