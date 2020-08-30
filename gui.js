let vnstatData = null;

void fetch('data.json')
    .then(async (response) => {
        vnstatData = await response.json();
        google.charts.load('current', { 'packages': ['corechart'] });
        google.charts.setOnLoadCallback(drawCharts);
    });

function buildTotalForm(iface, container) {
    const form = document.createElement('form');
    const day = localStorage.getItem('day') === null ? 1 : parseInt(localStorage.getItem('day'), 10);
    form.innerHTML = `<label>Data used from <input type="number" value="${day}" min="1" max="31" step="1" style="width: 60px">th: <strong></strong></label>`;
    container.appendChild(form);
    form.addEventListener('submit', (e) => { e.preventDefault(); updateGB() });
    form.querySelector('input').addEventListener('change', (e) => { e.preventDefault(); updateGB() });
    updateGB();

    function updateGB() {
        const dayLimit = form.querySelector('input').valueAsNumber;
        if (isNaN(dayLimit)) {
            return;
        }
        localStorage.setItem('day', dayLimit);
        let rx = 0;
        let tx = 0;
        const now = new Date();
        let limitDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        while (limitDate.getDate() > dayLimit) {
            limitDate.setDate(limitDate.getDate() - 1);
        }
        for (let day of iface.traffic.days) {
            const dayDate = new Date(now.getFullYear(), day.date.month - 1, day.date.day);
            if (dayDate < limitDate) {
                break;
            }
            rx += day.rx / 1024 / 1024;
            tx += day.tx / 1024 / 1024;
        }

        form.querySelector('strong').innerHTML = `Rx: ${rx.toFixed(2)}GB Tx: ${tx.toFixed(2)}GB Total: ${(tx + rx).toFixed(2)}GB`;
    }
}

function drawCharts() {
    const iface = vnstatData.interfaces[0];
    const name = iface.nick;
    const updatedAt = new Date(
        iface.updated.date.year,
        iface.updated.date.month - 1,
        iface.updated.date.day,
        iface.updated.time.hour,
        iface.updated.time.minutes);
    const relativeHoursUpdatedAt = (updatedAt - new Date()) / 1000 / 60 / 60;
    const rtf = new Intl.RelativeTimeFormat('en', { style: 'narrow' });
    const mainContainer = document.getElementById('charts');
    mainContainer.innerHTML = '';
    const title = document.createElement('h1');
    title.textContent = name;
    mainContainer.appendChild(title);
    const subtitle = document.createElement('h3');
    subtitle.textContent = `🕒 ${rtf.format(relativeHoursUpdatedAt, 'hours')}`;
    mainContainer.appendChild(subtitle);
    buildTotalForm(iface, mainContainer);
    drawMonthlyChart(iface, mainContainer);
    drawDailyChart(iface, mainContainer);
}

function drawMonthlyChart(iface, mainContainer) {
    const monthlyChartData = new google.visualization.DataTable();
    monthlyChartData.addColumn('string', 'Month');
    monthlyChartData.addColumn('number', 'tx');
    monthlyChartData.addColumn('number', 'rx');
    monthlyChartData.addColumn('number', 'total');
    const rows = iface.traffic.months
        .reverse()
        .map((month) => {
            return [
                `${month.date.year}-${month.date.month.toString().padStart(2, '0')} `,
                month.tx / 1024 / 1024,
                month.rx / 1024 / 1024,
                (month.rx + month.tx) / 1024 / 1024
            ];
        });

    monthlyChartData.addRows(rows);

    const options = {
        hAxis: {
            title: 'Month'
        },
        vAxis: {
            title: 'Transfer',
            format: '##GB'
        }
    };

    const chartContainer = document.createElement('div');
    mainContainer.appendChild(chartContainer);
    const chart = new google.visualization.ColumnChart(chartContainer);
    chart.draw(monthlyChartData, options);
}

function drawDailyChart(iface, mainContainer) {
    const dailyChartData = new google.visualization.DataTable();
    dailyChartData.addColumn('string', 'Day');
    dailyChartData.addColumn('number', 'tx');
    dailyChartData.addColumn('number', 'rx');
    dailyChartData.addColumn('number', 'total');
    const rows = iface.traffic.days
        .filter((day, i, array) => day.date.year === array[0].date.year && day.date.month === array[0].date.month)
        .reverse()
        .map((day) => {
            return [
                `${day.date.month.toString().padStart(2, '0')}-${day.date.day.toString().padStart(2, '0')}`,
                day.tx / 1024 / 1024,
                day.rx / 1024 / 1024,
                (day.rx + day.tx) / 1024 / 1024
            ];
        });

    dailyChartData.addRows(rows);

    const options = {
        hAxis: {
            title: 'Day'
        },
        vAxis: {
            title: 'Transfer',
            format: '##GB'
        }
    };

    const chartContainer = document.createElement('div');
    mainContainer.appendChild(chartContainer);
    const chart = new google.visualization.ColumnChart(chartContainer);
    chart.draw(dailyChartData, options);
}