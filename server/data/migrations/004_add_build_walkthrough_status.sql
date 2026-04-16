ALTER TABLE users
  ADD COLUMN build_walkthrough_status VARCHAR(20) NOT NULL DEFAULT 'dismissed'
  AFTER active_loadout_slot;
