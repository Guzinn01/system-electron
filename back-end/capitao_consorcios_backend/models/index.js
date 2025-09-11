const User = require("./User");
const Cliente = require("./Cliente");
const Consorcio = require("./Consorcio");
const HistoricoConsorcio = require("./HistoricoConsorcio");
const JornadaDeTrabalho = require("./JornadaDeTrabalho");

Consorcio.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });
Cliente.hasMany(Consorcio, { foreignKey: "clienteId", as: "consorcios" });

Consorcio.belongsTo(User, {
  foreignKey: "usuarioResponsavelId",
  as: "responsavel",
});
User.hasMany(Consorcio, {
  foreignKey: "usuarioResponsavelId",
  as: "consorciosResponsavel",
});

HistoricoConsorcio.belongsTo(Consorcio, {
  foreignKey: "consorcioId",
  as: "consorcio",
});
Consorcio.hasMany(HistoricoConsorcio, {
  foreignKey: "consorcioId",
  as: "historico",
});

HistoricoConsorcio.belongsTo(User, {
  foreignKey: "usuarioResponsavelId",
  as: "usuario",
});
User.hasMany(HistoricoConsorcio, {
  foreignKey: "usuarioResponsavelId",
  as: "historicosCriados",
});
JornadaDeTrabalho.belongsTo(User, { foreignKey: "userId", as: "usuario" });
User.hasMany(JornadaDeTrabalho, { foreignKey: "userId", as: "jornadas" });

module.exports = {
  User,
  Cliente,
  Consorcio,
  HistoricoConsorcio,
  JornadaDeTrabalho,
};
