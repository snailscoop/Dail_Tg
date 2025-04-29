/**
 * Moderation Commands
 * 
 * This module defines the command handlers for moderation-related commands
 * such as banning, muting, and issuing credentials to users.
 */

const moderationService = require('../services/moderationService');
const credentialService = require('../services/credentialService');
const didMapping = require('../services/didMapping');
const gundb = require('../services/gundb');

/**
 * Handle /ban command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleBanCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const moderatorId = msg.from.id;
  const moderatorUsername = msg.from.username;
  
  console.log(`[Bot] Moderator ${moderatorUsername} (${moderatorId}) attempted to use /ban command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete ban command: ${err.message}`);
  });
  
  // Check for required arguments
  if (args.length < 2) {
    const helpMsg = await bot.sendMessage(chatId, 
      'Usage: /ban @username reason\nExample: /ban @spammer Posting spam links');
    
    // Delete help message after 10 seconds
    setTimeout(() => {
      bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
    }, 10000);
    
    return;
  }
  
  // Extract username and reason
  const targetUsername = args[0].replace('@', '');
  const reason = args.slice(1).join(' ');
  
  try {
    // Get chat member by username
    const chatMembers = await bot.getChatAdministrators(chatId);
    const targetMember = await bot.getChatMember(chatId, `@${targetUsername}`).catch(() => null);
    
    if (!targetMember) {
      const errorMsg = await bot.sendMessage(chatId, `Could not find user @${targetUsername} in this chat.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    const targetUser = targetMember.user;
    
    // Cannot ban administrators
    const isAdmin = chatMembers.some(member => member.user.id === targetUser.id);
    if (isAdmin) {
      const errorMsg = await bot.sendMessage(chatId, 'Cannot ban administrators.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Perform the ban with consent
    const result = await moderationService.banUserWithConsent(
      moderatorId,
      targetUser.id,
      chatId,
      reason
    );
    
    if (result.success) {
      const successMsg = await bot.sendMessage(chatId, 
        `User @${targetUsername} has been banned for: ${reason}\n` +
        `Ban ID: ${result.banRecord.id}\n` +
        `This ban is verified with consent record and stored on cheqd DID infrastructure.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
      }, 15000);
    } else {
      const errorMsg = await bot.sendMessage(chatId, 
        `Failed to ban user: ${result.error}`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
    }
  } catch (error) {
    console.error('Error in ban command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error executing ban command: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /mute command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleMuteCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const moderatorId = msg.from.id;
  const moderatorUsername = msg.from.username;
  
  console.log(`[Bot] Moderator ${moderatorUsername} (${moderatorId}) attempted to use /mute command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete mute command: ${err.message}`);
  });
  
  // Check for required arguments
  if (args.length < 2) {
    const helpMsg = await bot.sendMessage(chatId, 
      'Usage: /mute @username reason\nExample: /mute @user Spamming');
    
    // Delete help message after 10 seconds
    setTimeout(() => {
      bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
    }, 10000);
    
    return;
  }
  
  // Extract username and reason
  const targetUsername = args[0].replace('@', '');
  const reason = args.slice(1).join(' ');
  
  try {
    // Get chat member by username
    const chatMembers = await bot.getChatAdministrators(chatId);
    const targetMember = await bot.getChatMember(chatId, `@${targetUsername}`).catch(() => null);
    
    if (!targetMember) {
      const errorMsg = await bot.sendMessage(chatId, `Could not find user @${targetUsername} in this chat.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    const targetUser = targetMember.user;
    
    // Cannot mute administrators
    const isAdmin = chatMembers.some(member => member.user.id === targetUser.id);
    if (isAdmin) {
      const errorMsg = await bot.sendMessage(chatId, 'Cannot mute administrators.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Perform the mute with consent
    const result = await moderationService.muteUserWithConsent(
      moderatorId,
      targetUser.id,
      chatId,
      reason,
      3600 // 1 hour
    );
    
    if (result.success) {
      const successMsg = await bot.sendMessage(chatId, 
        `User @${targetUsername} has been muted for 1 hour for: ${reason}\n` +
        `This mute is verified with consent record: ${result.consentId}\n` +
        `Stored on cheqd DID infrastructure.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
      }, 15000);
    } else {
      const errorMsg = await bot.sendMessage(chatId, 
        `Failed to mute user: ${result.error}`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
    }
  } catch (error) {
    console.error('Error in mute command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error executing mute command: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Get user from chat by username, reply, or user ID with simplified approach
 * @param {Object} bot - Telegram bot instance 
 * @param {Object} msg - Message object
 * @param {string} userIdentifier - Username or user ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserFromChat(bot, msg, userIdentifier, chatId) {
  // If replying to a message, use that user
  if (msg.reply_to_message) {
    console.log(`[Bot] Using replied-to user: ${msg.reply_to_message.from.id}`);
    try {
      const member = await bot.getChatMember(chatId, msg.reply_to_message.from.id);
      return member;
    } catch (error) {
      console.log(`[Bot] Error getting replied user: ${error.message}`);
    }
  }

  // Remove @ if present
  if (userIdentifier.startsWith('@')) {
    userIdentifier = userIdentifier.substring(1);
  }

  // Get all chat members (admins and regular members)
  try {
    // First try direct numeric ID if that's what was provided
    if (/^\d+$/.test(userIdentifier)) {
      console.log(`[Bot] Trying direct user ID lookup: ${userIdentifier}`);
      return await bot.getChatMember(chatId, userIdentifier);
    }

    // Get admin list
    const admins = await bot.getChatAdministrators(chatId);
    
    // Check if username matches any admin
    for (const admin of admins) {
      if (admin.user.username && admin.user.username.toLowerCase() === userIdentifier.toLowerCase()) {
        console.log(`[Bot] Found user in admin list: ${admin.user.id}`);
        return admin;
      }
    }
    
    // Simple direct lookup by username as final attempt
    try {
      // This is the standard way but often fails
      return await bot.getChatMember(chatId, `@${userIdentifier}`);
    } catch (err) {
      console.log(`[Bot] Standard username lookup failed: ${err.message}`);
      
      // Get recent messages to find the user (last resort)
      try {
        const updates = await bot.getUpdates();
        const relevantUpdates = updates.filter(update => 
          update.message && 
          update.message.chat.id === chatId && 
          update.message.from.username && 
          update.message.from.username.toLowerCase() === userIdentifier.toLowerCase()
        );
        
        if (relevantUpdates.length > 0) {
          const userId = relevantUpdates[0].message.from.id;
          console.log(`[Bot] Found user from message history: ${userId}`);
          return await bot.getChatMember(chatId, userId);
        }
      } catch (historyError) {
        console.log(`[Bot] Update history check failed: ${historyError.message}`);
      }
    }
  } catch (error) {
    console.log(`[Bot] Error in getUserFromChat: ${error.message}`);
  }

  return null;
}

/**
 * Handle /makemoderator command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleMakeModeratorCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] Admin ${username} (${userId}) attempted to use /makemoderator command in chat ${chatId}`);
  console.log(`[Debug] Admin ID type: ${typeof userId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete makemoderator command: ${err.message}`);
  });
  
  try {
    // Check for arguments
    if (args.length === 0 && !msg.reply_to_message) {
      const usageMsg = await bot.sendMessage(chatId, 
        'Usage: /makemoderator @username\n' +
        'Or reply to a message with /makemoderator');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, usageMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Check if the user has admin privileges
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only administrators can grant moderator privileges.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Get the target user
    let targetUser = null;
    
    if (msg.reply_to_message) {
      console.log(`[Bot] Using replied-to user: ${msg.reply_to_message.from.id}`);
      targetUser = msg.reply_to_message.from;
    } else {
      // Get username from arguments
      const username = args[0].replace('@', '');
      console.log(`[Bot] Looking up user by username: ${username}`);
      try {
        // Try to get user from chat members
        targetUser = await getUserFromChat(bot, msg, username, chatId);
      } catch (err) {
        console.error(`[Bot Error] ${err.message}`);
        
        const errorMsg = await bot.sendMessage(chatId, 
          `Could not find user "${username}" in this chat. ` +
          `Make sure they have posted at least one message.`);
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    if (!targetUser) {
      const errorMsg = await bot.sendMessage(chatId, 'Could not find the target user.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    console.log(`[Debug] Target user ID: ${targetUser.id} (${typeof targetUser.id}), username: ${targetUser.username}`);
    
    // Check if user already has moderator privileges
    const targetId = targetUser.id.toString();
    const targetUsername = targetUser.username || 'Unknown';
    
    const hasModerator = await credentialService.userHasModeratorCredential(targetId, chatId);
    console.log(`[Debug] Target user already has moderator credential: ${hasModerator}`);
    
    if (hasModerator) {
      const alreadyMsg = await bot.sendMessage(chatId, `User @${targetUsername} already has moderator privileges.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, alreadyMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Issue moderator credential
    console.log(`[Debug] Issuing moderator credential from ${userId} to ${targetId} for chat ${chatId}`);
    
    const permissions = {
      canBan: true,
      canMute: true,
      canDelete: true,
      canDeleteMedia: true,
      canIssueWarnings: true
    };
    
    const credential = await credentialService.issueModeratorCredential(
      userId.toString(), 
      targetId, 
      chatId.toString(), 
      permissions
    );
    
    console.log(`[Debug] Issued credential with ID: ${credential.id}`);
    
    // Send success message
    const successMsg = await bot.sendMessage(chatId, 
      `User @${targetUsername} has been granted moderator privileges in this chat.\n\n` +
      `They can now use /ban, /mute, and other moderation commands.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 15000);
  } catch (error) {
    console.error('Error in makemoderator command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error granting moderator privileges: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /banlist command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleBanListCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) requested banlist in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete banlist command: ${err.message}`);
  });
  
  try {
    // Check if user has moderator privileges
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasModeratorCred && !hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only moderators and administrators can view the ban list.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Get ban records for the chat
    const banRecords = await moderationService.getBanRecordsForChat(chatId);
    
    if (banRecords.length === 0) {
      const noBansMsg = await bot.sendMessage(chatId, 'There are no banned users in this chat.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, noBansMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Format ban list
    let banListText = 'Banned users in this chat:\n\n';
    
    for (const ban of banRecords) {
      const banDate = new Date(ban.timestamp).toLocaleString();
      banListText += `ID: ${ban.targetUser}\n`;
      banListText += `Reason: ${ban.reason}\n`;
      banListText += `Banned on: ${banDate}\n`;
      banListText += `Ban ID: ${ban.id}\n\n`;
    }
    
    const banListMsg = await bot.sendMessage(chatId, banListText);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, banListMsg.message_id).catch(() => {});
    }, 30000);
  } catch (error) {
    console.error('Error in ban list command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error retrieving ban list: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /crossbanstatus command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleCrossBanStatusCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) requested cross-ban status in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete crossbanstatus command: ${err.message}`);
  });
  
  try {
    // Check if user has moderator or admin privileges
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasModeratorCred && !hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only moderators and administrators can view cross-ban status.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Check current participation status
    const isParticipating = await moderationService.isChatParticipatingInCrossBans(chatId);
    
    const statusMsg = await bot.sendMessage(chatId, 
      `Cross-Chat Ban System Status:\n\n` +
      `This chat is currently ${isParticipating ? 'participating' : 'NOT participating'} in the cross-chat ban system.\n\n` +
      `When participating, any user banned in other participating chats will be highlighted to moderators.\n\n` +
      `Use /crossbanoptin to enable or /crossbanoptout to disable this feature.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    }, 30000);
  } catch (error) {
    console.error('Error in cross-ban status command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error retrieving cross-ban status: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /trust command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleTrustUserCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const adminId = msg.from.id;
  const adminUsername = msg.from.username;
  
  console.log(`[Bot] User ${adminUsername} (${adminId}) attempted to use /trust command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete trust command: ${err.message}`);
  });
  
  // Check for required arguments (unless replying to a message)
  if (args.length < 1 && !msg.reply_to_message) {
    const helpMsg = await bot.sendMessage(chatId, 
      'Usage: /trust @username\nOr reply to a message with /trust');
    
    setTimeout(() => {
      bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
    }, 10000);
    
    return;
  }
  
  // Get the target username or use replied-to message
  const targetIdentifier = args.length > 0 ? args[0] : '';
  
  try {
    // Check if user has admin or moderator privileges
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(adminId, chatId);
    const hasModeratorCred = await credentialService.userHasModeratorCredential(adminId, chatId);
    
    // If not an admin or moderator, check if they're a Telegram admin
    if (!hasAdminPrivileges && !hasModeratorCred) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === adminId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only administrators and moderators can designate trusted members.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Get the target user with our simplified function
    const targetMember = await getUserFromChat(bot, msg, targetIdentifier, chatId);
    
    if (!targetMember) {
      const username = targetIdentifier.startsWith('@') ? targetIdentifier : `@${targetIdentifier}`;
      const errorMsg = await bot.sendMessage(chatId, 
        `Could not find user ${username || 'from reply'}. Please make sure the user is in this chat and has sent at least one message.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 15000);
      
      return;
    }
    
    // Extract username for display
    const targetUsername = targetMember.user.username || targetMember.user.first_name || targetMember.user.id.toString();
    
    // Get GunDB instance and add the trusted member
    const gun = gundb.initBotNode();
    
    // Check if user is already trusted
    const isAlreadyTrusted = await gundb.isUserTrusted(gun, targetMember.user.id, chatId);
    if (isAlreadyTrusted) {
      const alreadyMsg = await bot.sendMessage(chatId, 
        `User @${targetUsername} is already a trusted member in this chat.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, alreadyMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Store trusted member record
    console.log(`[DEBUG] Storing trusted member with userId: ${targetMember.user.id} (${typeof targetMember.user.id}), username: ${targetUsername}, chatId: ${chatId} (${typeof chatId}), adminId: ${adminId} (${typeof adminId})`);
    await gundb.storeTrustedMember(
      gun,
      targetMember.user.id,
      targetUsername,
      chatId,
      adminId
    );
    console.log(`[DEBUG] Successfully stored trusted member record`);
    
    const successMsg = await bot.sendMessage(chatId, 
      `User @${targetUsername} (ID: ${targetMember.user.id}) has been added as a trusted member for this chat.\n` +
      `They will have access to certain privileged actions, but not full moderation capabilities.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 15000);
  } catch (error) {
    console.error('[Bot Error] Error in trust user command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error adding trusted member: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /untrust command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleUntrustUserCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const adminId = msg.from.id;
  const adminUsername = msg.from.username;
  
  console.log(`[Bot] User ${adminUsername} (${adminId}) attempted to use /untrust command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete untrust command: ${err.message}`);
  });
  
  // Check for required arguments
  if (args.length < 1) {
    const helpMsg = await bot.sendMessage(chatId, 
      'Usage: /untrust @username\nExample: /untrust @no_longer_trusted');
    
    // Delete help message after 10 seconds
    setTimeout(() => {
      bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
    }, 10000);
    
    return;
  }
  
  // Extract username, ensuring it's in the correct format for API calls
  let targetUsername = args[0];
  // Remove @ if present
  if (targetUsername.startsWith('@')) {
    targetUsername = targetUsername.substring(1);
  }
  
  try {
    // Check if user has admin or moderator privileges
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(adminId, chatId);
    const hasModeratorCred = await credentialService.userHasModeratorCredential(adminId, chatId);
    
    // If not an admin or moderator, check if they're a Telegram admin
    if (!hasAdminPrivileges && !hasModeratorCred) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === adminId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only administrators and moderators can remove trusted members.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Same user finding logic as in handleTrustUserCommand
    // ... [Code omitted for brevity - you can copy from handleTrustUserCommand] 
    
    // Get GunDB instance
    const gun = gundb.initBotNode();
    
    // For simplicity, get all trusted members and filter by username
    const trustedMembers = await gundb.getTrustedMembersForChat(gun, chatId);
    const targetMember = trustedMembers.find(member => 
      member.username && member.username.toLowerCase() === targetUsername.toLowerCase());
    
    if (!targetMember) {
      const notFoundMsg = await bot.sendMessage(chatId, 
        `User @${targetUsername} is not a trusted member in this chat.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, notFoundMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Remove trusted member record
    await gundb.removeTrustedMember(gun, targetMember.userId, chatId);
    
    const successMsg = await bot.sendMessage(chatId, 
      `User @${targetUsername} has been removed from the trusted members list.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 15000);
  } catch (error) {
    console.error('[Bot Error] Error in untrust user command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error removing trusted member: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /trustedlist command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleTrustedListCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) requested trusted members list in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete trustedlist command: ${err.message}`);
  });
  
  try {
    // Check if user has admin or moderator privileges
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    
    // If not an admin or moderator, check if they're a Telegram admin
    if (!hasAdminPrivileges && !hasModeratorCred) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only administrators and moderators can view the trusted members list.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Get trusted members for the chat
    const gun = gundb.initBotNode();
    const trustedMembers = await gundb.getTrustedMembersForChat(gun, chatId);
    
    if (trustedMembers.length === 0) {
      const noMembersMsg = await bot.sendMessage(chatId, 'There are no trusted members in this chat.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, noMembersMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Format trusted members list
    let listText = 'Trusted members in this chat:\n\n';
    
    for (const member of trustedMembers) {
      const addedDate = new Date(member.timestamp).toLocaleString();
      listText += `@${member.username} (ID: ${member.userId})\n`;
      listText += `Added on: ${addedDate}\n\n`;
    }
    
    const listMsg = await bot.sendMessage(chatId, listText);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, listMsg.message_id).catch(() => {});
    }, 30000);
  } catch (error) {
    console.error('[Bot Error] Error in trusted list command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error retrieving trusted members list: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /crossbanoptin command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleCrossBanOptInCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) attempted to opt-in to cross-ban system in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete crossbanoptin command: ${err.message}`);
  });
  
  try {
    // Check if user has moderator or admin privileges
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasModeratorCred && !hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only moderators and administrators can change cross-ban system settings.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Set participation to true
    await moderationService.setCrossChatBanParticipation(chatId, true);
    
    const successMsg = await bot.sendMessage(chatId, 
      `This chat is now participating in the cross-chat ban system.\n\n` +
      `Users who have been banned in other participating chats will be highlighted to moderators.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 15000);
  } catch (error) {
    console.error('Error in cross-ban opt-in command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error enabling cross-ban participation: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /crossbanoptout command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleCrossBanOptOutCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) attempted to opt-out of cross-ban system in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete crossbanoptout command: ${err.message}`);
  });
  
  try {
    // Check if user has moderator or admin privileges
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasModeratorCred && !hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only moderators and administrators can change cross-ban system settings.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Set participation to false
    await moderationService.setCrossChatBanParticipation(chatId, false);
    
    const successMsg = await bot.sendMessage(chatId, 
      `This chat is no longer participating in the cross-chat ban system.\n\n` +
      `Ban information will not be shared with other chats, and this chat will not receive ban notifications from other chats.`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 15000);
  } catch (error) {
    console.error('Error in cross-ban opt-out command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error disabling cross-ban participation: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /deletemedia command - Deletes a media message that was replied to
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleDeleteMediaCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] User ${username} (${userId}) attempted to use /deletemedia command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete deletemedia command: ${err.message}`);
  });
  
  try {
    // Must be replying to a message
    if (!msg.reply_to_message) {
      const helpMsg = await bot.sendMessage(chatId, 
        'Usage: Reply to a media message with /deletemedia to remove it.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Check if the replied-to message contains media
    const targetMsg = msg.reply_to_message;
    const hasMedia = Boolean(
      targetMsg.photo || 
      targetMsg.video || 
      targetMsg.audio || 
      targetMsg.voice || 
      targetMsg.sticker || 
      targetMsg.animation || 
      targetMsg.document
    );
    
    if (!hasMedia) {
      const notMediaMsg = await bot.sendMessage(chatId, 
        'This command can only be used to delete media messages (photos, videos, documents, etc.).');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, notMediaMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Check if the user has media deletion privileges
    const hasModeratorCred = await credentialService.userHasModeratorCredential(userId, chatId);
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    // If not an admin, check for the specific canDeleteMedia permission
    if (!hasAdminPrivileges) {
      if (!hasModeratorCred) {
        const chatAdmins = await bot.getChatAdministrators(chatId);
        const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
        
        if (!isAdmin) {
          const errorMsg = await bot.sendMessage(chatId, 'You do not have permission to delete media messages.');
          
          setTimeout(() => {
            bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
          }, 10000);
          
          return;
        }
      } else {
        // Verify the specific canDeleteMedia permission
        const canDeleteMedia = await credentialService.userHasPermission(userId, chatId, 'canDeleteMedia');
        
        if (!canDeleteMedia) {
          const errorMsg = await bot.sendMessage(chatId, 
            'You have moderator credentials but lack media deletion permission.');
          
          setTimeout(() => {
            bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
          }, 10000);
          
          return;
        }
      }
    }
    
    // Delete the media message
    await bot.deleteMessage(chatId, targetMsg.message_id);
    
    // Send success message
    const successMsg = await bot.sendMessage(chatId, 'Media has been deleted.');
    
    setTimeout(() => {
      bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
    }, 5000);
    
  } catch (error) {
    console.error('Error in deletemedia command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error deleting media message: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /revokemoderator command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<void>}
 */
async function handleRevokeModeratorCommand(bot, msg, args) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  
  console.log(`[Bot] Admin ${username} (${userId}) attempted to use /revokemoderator command in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete revokemoderator command: ${err.message}`);
  });
  
  try {
    // Check for arguments
    if (args.length === 0 && !msg.reply_to_message) {
      const usageMsg = await bot.sendMessage(chatId, 
        'Usage: /revokemoderator @username\n' +
        'Or reply to a message with /revokemoderator');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, usageMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Check if the user has admin privileges
    const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(userId, chatId);
    
    if (!hasAdminPrivileges) {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      
      if (!isAdmin) {
        const errorMsg = await bot.sendMessage(chatId, 'Only administrators can revoke moderator privileges.');
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    // Get the target user
    let targetUser = null;
    
    if (msg.reply_to_message) {
      console.log(`[Bot] Using replied-to user: ${msg.reply_to_message.from.id}`);
      targetUser = msg.reply_to_message.from;
    } else {
      // Get username from arguments
      const username = args[0].replace('@', '');
      console.log(`[Bot] Looking up user by username: ${username}`);
      try {
        // Try to get user from chat members
        targetUser = await getUserFromChat(bot, msg, username, chatId);
      } catch (err) {
        console.error(`[Bot Error] ${err.message}`);
        
        const errorMsg = await bot.sendMessage(chatId, 
          `Could not find user "${username}" in this chat. ` +
          `Make sure they have posted at least one message.`);
        
        setTimeout(() => {
          bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
        }, 10000);
        
        return;
      }
    }
    
    if (!targetUser) {
      const errorMsg = await bot.sendMessage(chatId, 'Could not find the target user.');
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    console.log(`[Debug] Target user ID: ${targetUser.id} (${typeof targetUser.id}), username: ${targetUser.username}`);
    
    // Check if user has moderator privileges
    const targetId = targetUser.id.toString();
    const targetUsername = targetUser.username || 'Unknown';
    
    const hasModerator = await credentialService.userHasModeratorCredential(targetId, chatId);
    console.log(`[Debug] Target user has moderator credential: ${hasModerator}`);
    
    if (!hasModerator) {
      const alreadyMsg = await bot.sendMessage(chatId, `User @${targetUsername} does not have moderator privileges to revoke.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, alreadyMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Get the moderator credentials to find their IDs
    const moderatorCredentials = await credentialService.getModeratorCredentials(targetId);
    const chatCredentials = moderatorCredentials.filter(cred => 
      cred.metadata && cred.metadata.chatId === chatId.toString());
    
    if (chatCredentials.length === 0) {
      const errorMsg = await bot.sendMessage(chatId, 
        `Found no specific moderator credentials for this chat. This is unexpected.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 10000);
      
      return;
    }
    
    // Revoke each credential
    let successCount = 0;
    let errorMessages = [];
    
    for (const credential of chatCredentials) {
      try {
        await credentialService.revokeCredential(
          userId.toString(),
          credential.id
        );
        successCount++;
      } catch (error) {
        console.error(`Error revoking credential ${credential.id}:`, error);
        errorMessages.push(error.message);
      }
    }
    
    // Send result message
    if (successCount > 0) {
      const successMsg = await bot.sendMessage(chatId, 
        `Moderator privileges for user @${targetUsername} have been revoked in this chat.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
      }, 15000);
    } else {
      const errorMsg = await bot.sendMessage(chatId, 
        `Failed to revoke moderator privileges: ${errorMessages.join(', ')}`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
      }, 15000);
    }
  } catch (error) {
    console.error('Error in revokemoderator command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error revoking moderator privileges: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Register moderation commands with the bot
 * @param {Object} bot - Telegram bot instance
 */
function registerModerationCommands(bot) {
  // Register ban command handler
  bot.onText(/\/ban(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ');
    handleBanCommand(bot, msg, args);
  });
  
  // Fallback for incorrect ban command usage
  bot.onText(/\/ban(@\w+)*$/, (msg) => {
    handleBanCommand(bot, msg, []);
  });
  
  // Register mute command handler
  bot.onText(/\/mute(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ');
    handleMuteCommand(bot, msg, args);
  });
  
  // Fallback for incorrect mute command usage
  bot.onText(/\/mute(@\w+)*$/, (msg) => {
    handleMuteCommand(bot, msg, []);
  });
  
  // Register make moderator command handler
  bot.onText(/\/makemoderator(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ');
    handleMakeModeratorCommand(bot, msg, args);
  });
  
  // Fallback for incorrect makemoderator command usage
  bot.onText(/\/makemoderator(@\w+)*$/, (msg) => {
    handleMakeModeratorCommand(bot, msg, []);
  });
  
  // Register revoke moderator command handler
  bot.onText(/\/revokemoderator(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ');
    handleRevokeModeratorCommand(bot, msg, args);
  });
  
  // Fallback for incorrect revokemoderator command usage
  bot.onText(/\/revokemoderator(@\w+)*$/, (msg) => {
    handleRevokeModeratorCommand(bot, msg, []);
  });
  
  // Register banlist command handler
  bot.onText(/\/banlist(@\w+)*/, (msg) => {
    handleBanListCommand(bot, msg);
  });
  
  // Register cross-ban status command handler
  bot.onText(/\/crossbanstatus(@\w+)*/, (msg) => {
    handleCrossBanStatusCommand(bot, msg);
  });
  
  // Register cross-ban opt-in/opt-out commands
  bot.onText(/\/crossbanoptin(@\w+)*/, (msg) => {
    handleCrossBanOptInCommand(bot, msg);
  });
  
  bot.onText(/\/crossbanoptout(@\w+)*/, (msg) => {
    handleCrossBanOptOutCommand(bot, msg);
  });
  
  // Register trust commands
  bot.onText(/\/trust(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ').filter(arg => arg.trim() !== '');
    handleTrustUserCommand(bot, msg, args);
  });
  
  // Fallback for incorrect trust command usage
  bot.onText(/\/trust(@\w+)*$/, (msg) => {
    handleTrustUserCommand(bot, msg, []);
  });
  
  // Register untrust commands
  bot.onText(/\/untrust(@\w+)* (.+)/, (msg, match) => {
    const args = match[2].split(' ').filter(arg => arg.trim() !== '');
    handleUntrustUserCommand(bot, msg, args);
  });
  
  // Fallback for incorrect untrust command usage
  bot.onText(/\/untrust(@\w+)*$/, (msg) => {
    handleUntrustUserCommand(bot, msg, []);
  });
  
  // Register trusted list command
  bot.onText(/\/trustedlist(@\w+)*$/, (msg) => {
    handleTrustedListCommand(bot, msg);
  });
  
  // Register delete media command
  bot.onText(/\/deletemedia(@\w+)*$/, (msg) => {
    handleDeleteMediaCommand(bot, msg);
  });
}

module.exports = {
  registerModerationCommands,
  handleBanCommand,
  handleMuteCommand,
  handleMakeModeratorCommand,
  handleRevokeModeratorCommand,
  handleBanListCommand,
  handleCrossBanStatusCommand,
  handleCrossBanOptInCommand,
  handleCrossBanOptOutCommand,
  handleTrustUserCommand,
  handleUntrustUserCommand,
  handleTrustedListCommand,
  handleDeleteMediaCommand
};
