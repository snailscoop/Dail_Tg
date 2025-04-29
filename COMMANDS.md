# CHEQD Telegram Bot Command Reference

## Moderation Commands

| Command | Description | Required Privileges | Example |
|---------|-------------|---------------------|---------|
| `/ban @username reason` | Bans a user from the chat with specified reason | Admin or Moderator (with `canBan`) | `/ban @spammer Posting spam links` |
| `/mute @username reason` | Mutes a user for 1 hour | Admin or Moderator (with `canMute`) | `/mute @user Spamming` |
| `/makemoderator @username` | Grants moderator privileges to a user | Admin | `/makemoderator @trustworthy` |
| `/revokemoderator @username` | Revokes moderator privileges from a user | Admin | `/revokemoderator @username` |
| `/banlist` | Shows all banned users in the chat | Admin or Moderator | `/banlist` |
| `/deletemedia` | Deletes media message when used as a reply | Admin or Moderator (with `canDeleteMedia`) | Reply to media with `/deletemedia` |

## Trust System Commands

| Command | Description | Required Privileges | Example |
|---------|-------------|---------------------|---------|
| `/trust @username` | Adds a user as a trusted member | Admin or Moderator | `/trust @helpful_user` |
| `/untrust @username` | Removes a user from trusted members | Admin or Moderator | `/untrust @no_longer_trusted` |
| `/trustedlist` | Shows all trusted members in the chat | Admin or Moderator | `/trustedlist` |

## Cross-Ban System Commands

| Command | Description | Required Privileges | Example |
|---------|-------------|---------------------|---------|
| `/crossbanstatus` | Shows if chat is participating in cross-ban system | Admin or Moderator | `/crossbanstatus` |
| `/crossbanoptin` | Enables participation in cross-ban system | Admin or Moderator | `/crossbanoptin` |
| `/crossbanoptout` | Disables participation in cross-ban system | Admin or Moderator | `/crossbanoptout` |

## Permission System

Moderator credentials can include the following permissions:

- `canBan`: Ability to ban users
- `canMute`: Ability to mute users
- `canDelete`: Ability to delete messages
- `canDeleteMedia`: Ability to delete media content
- `canIssueWarnings`: Ability to issue warnings to users

Admin credentials automatically include all of these permissions, plus:
- `canIssueCredentials`: Ability to issue credentials to other users
- `canRevokeCredentials`: Ability to revoke credentials

## Protection Hierarchy

The moderation system follows this protection hierarchy:

1. **Chat Owners/Admins**: Cannot be moderated by moderators
2. **Moderators**: Can moderate regular users and trusted members
3. **Trusted Members**: Have community recognition but are subject to moderation
4. **Regular Users**: Subject to all moderation actions

## Using Reply Feature

Many commands can be used by replying to a user's message instead of specifying a username:

```
[Reply to a message] + /ban Posting spam
[Reply to a media message] + /deletemedia
[Reply to a message] + /trust
[Reply to a message] + /revokemoderator
```

## Technical Details

All moderation actions are recorded with:
- Consent records stored in GunDB
- Credential verification via cheqd DID infrastructure
- Timestamp and admin/moderator attribution 