import test from "node:test"
import assert from "node:assert/strict"

import {
  BUILD_WALKTHROUGH_STATUS,
  normalizeBuildWalkthrough,
} from "../src/constants/buildWalkthrough.js"

test("normalizeBuildWalkthrough falls back to dismissed for unknown states", () => {
  const normalized = normalizeBuildWalkthrough({ status: "mystery" })

  assert.deepEqual(normalized, {
    status: BUILD_WALKTHROUGH_STATUS.DISMISSED,
  })
})

test("normalizeBuildWalkthrough accepts string shorthand and explicit fallback", () => {
  const normalized = normalizeBuildWalkthrough(
    "invalid",
    BUILD_WALKTHROUGH_STATUS.NOT_STARTED
  )

  assert.deepEqual(normalized, {
    status: BUILD_WALKTHROUGH_STATUS.NOT_STARTED,
  })
})
