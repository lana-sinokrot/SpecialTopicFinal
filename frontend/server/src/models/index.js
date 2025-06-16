const User = require('./user.model');
const StudyGroup = require('./group.model');
const GroupMembership = require('./groupMembership.model');

// User-StudyGroup relationships through GroupMembership
User.belongsToMany(StudyGroup, {
  through: GroupMembership,
  foreignKey: 'userId',
  otherKey: 'groupId'
});

StudyGroup.belongsToMany(User, {
  through: GroupMembership,
  foreignKey: 'groupId',
  otherKey: 'userId'
});

// Creator relationship
StudyGroup.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
});

User.hasMany(StudyGroup, {
  foreignKey: 'creatorId',
  as: 'createdGroups'
});

module.exports = {
  User,
  StudyGroup,
  GroupMembership
}; 