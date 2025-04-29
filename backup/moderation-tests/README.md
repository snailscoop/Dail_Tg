# CHEQD Telegram Bot Moderation Tests

This directory contains scripts and configurations for testing the moderation system of the CHEQD Telegram Bot.

## Available Tests

The test suite verifies the following functionality:

1. **Trust Management**
   - Adding trusted members with `/trust`
   - Preventing duplicate trust relationships
   - Listing trusted members with `/trustedmembers`
   - Removing trust with `/untrust`

2. **Moderation Actions**
   - Muting users with `/mute`
   - Banning users with `/ban`
   - Deleting media content with `/deletemedia`
   - Protection hierarchy (admins > moderators > regular users)

3. **Credential Management**
   - Creating moderator credentials with `/makemoderator`
   - Credential verification and validation
   - Permission enforcement
   - Retrieving credentials with `/mycredential`

## Running the Tests

To run the full test suite:

```bash
./run-moderation-tests.sh
```

For testing only the trust system:

```bash
node test-trust.js
```

## Test Configuration

Tests use a mock environment that simulates:
- Telegram chat participants
- Admin privileges
- Message exchanges
- Media messages

## Cleaning Up Test Data

After running tests, you can clean up test data from GunDB:

```bash
node cleanup-test-data.js
```

## Extending the Tests

To add new tests:

1. For moderation features, edit `test-moderation.js`
2. For trust-related features, edit `test-trust.js`
3. Add new test scripts as needed

## Media Deletion Tests

To test the media deletion functionality:

1. The test creates a simulated media message
2. A moderator attempts to delete it using `/deletemedia`
3. The system verifies the moderator has the `canDeleteMedia` permission
4. The test confirms the media is deleted successfully

## Notes

- These tests use real GunDB instances, so clean up after testing
- Log output will show detailed information about test execution
- Failed tests will be clearly marked in red in the console output 