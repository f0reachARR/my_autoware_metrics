fetch('github_action_data.json')
  .then((res) => res.json())
  .then((json) => {
    // Package duration chart
    const allPackageDurationOptions = {
      series: [],
      chart: {
        height: 350,
        type: 'donut',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (_event, _chartContext, config) => {
            const dataPoint = config.dataPointIndex;
            if (dataPoint === undefined) {
              return;
            }
          },
        },
        animations: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'All package build duration',
        align: 'left',
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return `${Math.ceil(val / 60)}m${(val % 60).toFixed(0)}s`;
          },
        },
      },
    };

    const allPackageDurationChart = new ApexCharts(
      document.querySelector('#all-package-time-chart'),
      allPackageDurationOptions,
    );
    allPackageDurationChart.render();

    // Handler
    const showAllPackageDuration = (buildIndex) => {
      const packageDetails = json.workflow_time[buildIndex].details ?? {};
      const packageLabels = Object.keys(packageDetails).sort(
        (a, b) => packageDetails[b] - packageDetails[a],
      );
      const packageData = packageLabels.map((label) => packageDetails[label]);

      const topPackageCount = 150;
      const topPackageLabels = packageLabels.slice(0, topPackageCount);
      const topPackageData = packageData.slice(0, topPackageCount);
      const remainingPackageSum = packageData
        .slice(30)
        .reduce((a, b) => a + b, 0);
      allPackageDurationChart.updateOptions({
        labels: [...topPackageLabels, 'Others'],
      });
      allPackageDurationChart.updateSeries([
        ...topPackageData,
        remainingPackageSum,
      ]);

      const buildSelector = document.querySelector('#build-select');
      buildSelector.value = buildIndex;
    };

    // Each package duration chart

    // Build duration chart
    const buildDurationOptions = {
      series: [
        {
          name: 'Build duration',
          data: json.workflow_time.map((data) => {
            return [new Date(data.date), data.duration];
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (_event, _chartContext, config) => {
            const dataPoint = config.dataPointIndex;
            if (dataPoint === undefined) {
              return;
            }

            showAllPackageDuration(dataPoint);
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'Build duration',
        align: 'left',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        labels: {
          formatter: (val) => `${val.toFixed(2)}h`,
        },
        title: {
          text: 'Duration',
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return `${val.toFixed(2)}h`;
          },
        },
      },
    };

    const buildDurationChart = new ApexCharts(
      document.querySelector('#build-time-chart'),
      buildDurationOptions,
    );
    buildDurationChart.render();

    // Build selector
    const buildSelector = document.querySelector('#build-select');
    json.workflow_time.forEach((data, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.text = `${data.date} (${data.duration.toFixed(2)}h)`;
      buildSelector.appendChild(option);
    });

    buildSelector.addEventListener('change', (event) => {
      showAllPackageDuration(Number(event.target.value));
    });

    // Package selector
    const packageSelector = document.querySelector('#package-select');
    Object.keys(json.package_time)
      .sort()
      .forEach((key) => {
        const option = document.createElement('option');
        option.value = key;
        option.text = `${key} (${json.package_time[key].length} builds)`;
        packageSelector.appendChild(option);
      });

    // Package table
    const packageTable = document.querySelector('#package-table');
    const packageTableData = json.packages.map((data) => {
      return {
        name: data.name,
        version: data.version,
        size: data.size,
        gzip: data.gzip,
      };
    });
  });