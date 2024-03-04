/* eslint-disable prefer-const */
import { BigInt } from '@graphprotocol/graph-ts'
import { Pool, Tick } from '../types/schema'
import {
  Burn as BurnEvent,
  Initialize,
  Mint as MintEvent,
  Swap as SwapEvent
} from '../types/templates/Pool/Pool'
import { createTick } from '../utils/tick'

export function handleInitialize(event: Initialize): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) {
    return
  }

  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
}

export function handleMint(event: MintEvent): void {
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  if (pool === null) {
    return
  }

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on mint if the new position includes the current tick.
  if (
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.plus(event.params.amount)
  }

  // tick entities
  let lowerTickIdx = event.params.tickLower
  let upperTickIdx = event.params.tickUpper

  let lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
  let upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()

  let lowerTick = Tick.load(lowerTickId)
  let upperTick = Tick.load(upperTickId)

  if (lowerTick === null) {
    lowerTick = createTick(lowerTickId, lowerTickIdx, pool.id, event)
  }

  if (upperTick === null) {
    upperTick = createTick(upperTickId, upperTickIdx, pool.id, event)
  }

  let amount = event.params.amount
  lowerTick.liquidityGross = lowerTick.liquidityGross.plus(amount)
  lowerTick.liquidityNet = lowerTick.liquidityNet.plus(amount)
  upperTick.liquidityGross = upperTick.liquidityGross.plus(amount)
  upperTick.liquidityNet = upperTick.liquidityNet.minus(amount)

  pool.save()
  lowerTick.save()
  upperTick.save()
}

export function handleBurn(event: BurnEvent): void {
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  if (pool === null) {
    return
  }

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on burn if the position being burnt includes the current tick.
  if (
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.minus(event.params.amount)
  }

  // tick entities
  let lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
  let upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()
  let lowerTick = Tick.load(lowerTickId)
  if (lowerTick === null) {
    return
  }
  let upperTick = Tick.load(upperTickId)
  if (upperTick === null) {
    return
  }
  let amount = event.params.amount
  lowerTick.liquidityGross = lowerTick.liquidityGross.minus(amount)
  lowerTick.liquidityNet = lowerTick.liquidityNet.minus(amount)
  upperTick.liquidityGross = upperTick.liquidityGross.minus(amount)
  upperTick.liquidityNet = upperTick.liquidityNet.plus(amount)

  pool.save()
  lowerTick.save()
  upperTick.save()
}

export function handleSwap(event: SwapEvent): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) {
    return
  }

  // Update the pool with the new active liquidity, price, and tick.
  pool.liquidity = event.params.liquidity
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.sqrtPrice = event.params.sqrtPriceX96

  pool.save()
}
