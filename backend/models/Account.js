module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define(
    "Account",
    {
      roleId: { type: DataTypes.INTEGER, allowNull: false, field: "role_id" },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },

      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "password_hash",
      },

      eMail: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: "email",
      },

      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "last_name",
      },
    },
    {
      tableName: "accounts",
      timestamps: false,
    },
  );

  return Account;
};
