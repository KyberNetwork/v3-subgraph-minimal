/* eslint-disable prefer-const */
import { BigInt } from '@graphprotocol/graph-ts'
import { Tick } from '../../generated/schema'
import { Mint as MintEvent } from '../../generated/templates/Pool/Pool'
import { ZERO_BI } from './constants'

export function createTick(tickId: string, tickIdx: i32, poolId: string, event: MintEvent): Tick {
  let tick = new Tick(tickId)
  tick.tickIdx = BigInt.fromI32(tickIdx)
  tick.pool = poolId
  tick.poolAddress = poolId

  tick.createdAtTimestamp = event.block.timestamp
  tick.createdAtBlockNumber = event.block.number
  tick.liquidityGross = ZERO_BI
  tick.liquidityNet = ZERO_BI

  return tick
}
