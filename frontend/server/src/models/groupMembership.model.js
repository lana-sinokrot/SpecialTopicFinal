const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMembership = sequelize.define('GroupMembership', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'StudyGroups',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = GroupMembership; 