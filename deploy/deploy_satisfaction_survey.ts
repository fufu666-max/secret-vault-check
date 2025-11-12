import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("SatisfactionSurvey", {
    from: deployer,
    args: [deployer], // set deployer as decrypt manager by default
    log: true,
  });

  console.log(`SatisfactionSurvey contract: `, deployed.address);
};

export default func;
func.id = "deploy_satisfaction_survey";
func.tags = ["SatisfactionSurvey"];

