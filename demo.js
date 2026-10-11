import { plotLine, plotScatter } from "./src/index.js";

const data = { url: "./example.csv" };

Promise.all([
  plotScatter("#scatter-chart", data, {
    title: "Experiment observations",
    xLabel: "Trial",
    yLabel: "Reading",
  }),
  plotLine("#line-chart", data, {
    title: "Experiment trend",
    xLabel: "Trial",
    yLabel: "Reading",
  }),
]).catch((error) => {
  for (const chart of document.querySelectorAll(".chart")) {
    chart.textContent = `Unable to render demo: ${error.message}`;
  }
});
