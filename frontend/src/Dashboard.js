import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ setIsAuthenticated, role }) => {
    const navigate = useNavigate();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [etherData, setEtherData] = useState([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [totalDevices, setTotalDevices] = useState(0);
    const [schoolFilter, setSchoolFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [timeRange, setTimeRange] = useState('24h');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [logsContent, setLogsContent] = useState('');
    const [selectedDevice, setSelectedDevice] = useState('');
    const [routerIP, setRouterIP] = useState('');
    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible);
    };
    const handleLogout = () => {
        // Удаляем токен из localStorage
        localStorage.removeItem('authToken');
      
        // Сбрасываем состояние аутентификации
        setIsAuthenticated(false);
      
        // Перенаправляем на страницу аутентификации
        navigate('/');
      };


    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('http://10.2.13.12:9090/api/v1/query?query=up{job=%22mikrotik%22}%20or%20up{job=%22cisco_router%22}');
            const result = await response.json();
            if (result.status === 'success') {
                setTableData(result.data.result);
                setFilteredData(result.data.result);
                setTotalDevices(result.data.result.length);
            } else {
                console.error('Error fetching data from Prometheus:', result.error);
            }
        } catch (error) {
            console.error('Error fetching data from Prometheus:', error);
        }
    }, []);
    const fetchLogs = async (deviceIP) => {
        try {
            const response = await fetch(`http://10.2.13.12:8080/logs/${deviceIP}`);
            if (response.ok) {
                const logs = await response.text();
                setLogsContent(logs);
            } else {
                setLogsContent(`Error: Unable to fetch logs for ${deviceIP}`);
            }
        } catch (error) {
            setLogsContent(`Error: ${error.message}`);
        }
    };

    const openLogsModal = (deviceIP) => {
        setSelectedDevice(deviceIP);
        setLogsContent('Fetching logs...');
        setIsLogsModalOpen(true);
        fetchLogs(deviceIP);
    };

    const closeLogsModal = () => {
        setIsLogsModalOpen(false);
        setLogsContent('');
        setSelectedDevice('');
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchOnlineCount = useCallback(async () => {
        try {
            const response = await fetch('http://10.2.13.12:9090/api/v1/query?query=count(up{job="cisco_router"} == 1)');
            const result = await response.json();
            if (result.status === 'success' && result.data.result.length > 0) {
                setOnlineCount(parseInt(result.data.result[0].value[1], 10));
            } else {
                console.error('Error fetching online count from Prometheus:', result.error);
            }
        } catch (error) {
            console.error('Error fetching online count from Prometheus:', error);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let timeoutId;

        const fetchDataAndOnlineCount = async () => {
            if (!isCancelled) {
                await fetchData();
                await fetchOnlineCount();
                timeoutId = setTimeout(fetchDataAndOnlineCount, 10000);
            }
        };

        fetchDataAndOnlineCount();

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [fetchData, fetchOnlineCount]);

    useEffect(() => {
        const fetchEtherData = async () => {
            const endTime = Math.floor(Date.now() / 1000);
            let startTime;
            let step;
            switch (timeRange) {
                case '5m':
                    startTime = endTime - 5 * 60;
                    step = 5 * 60 / 24;
                    break;
                case '30m':
                    startTime = endTime - 30 * 60;
                    step = 30 * 60 / 24;
                    break;
                case '1h':
                    startTime = endTime - 60 * 60;
                    step = 60 * 60 / 24;
                    break;
                case '5h':
                    startTime = endTime - 5 * 60 * 60;
                    step = 5 * 60 * 60 / 24;
                    break;
                case '10h':
                    startTime = endTime - 10 * 60 * 60;
                    step = 10 * 60 * 60 / 24;
                    break;
                case '24h':
                    startTime = endTime - 24 * 60 * 60;
                    step = 60 * 60;
                    break;
                case '5d':
                    startTime = endTime - 5 * 24 * 60 * 60;
                    step = 5 * 24 * 60 * 60 / 24;
                    break;
                case '10d':
                    startTime = endTime - 10 * 24 * 60 * 60;
                    step = 10 * 24 * 60 * 60 / 24;
                    break;
                default:
                    startTime = endTime - 24 * 60 * 60;
                    step = 60 * 60;
            }

            try {
                const response = await fetch(
                    `http://10.2.13.12:9090/api/v1/query_range?query=avg(ifOutOctets_Eth0_0{job="cisco_router"})&start=${startTime}&end=${endTime}&step=${step}`
                );
                const result = await response.json();
                if (result.status === 'success' && result.data.result.length > 0) {
                    const dataPoints = result.data.result[0].values.map(value => parseFloat(value[1]));
                    setEtherData(dataPoints);
                } else {
                    console.error('Error fetching ether1_outOctet data:', result.error || 'No data available');
                }
            } catch (error) {
                console.error('Error fetching ether1_outOctet data:', error);
            }
        };

        fetchEtherData();
    }, [timeRange]);

    useEffect(() => {
        if (tableData.length > 0) {
            let filtered = tableData;

            if (schoolFilter) {
                filtered = filtered.filter((item, idx) =>
                    (`Школа ${idx + 1}`).toLowerCase().includes(schoolFilter.toLowerCase())
                );
            }

            if (regionFilter) {
                filtered = filtered.filter((item, idx) =>
                    (`Region ${idx + 1}`).toLowerCase() === regionFilter.toLowerCase()
                );
            }

            if (statusFilter) {
                filtered = filtered.filter(item =>
                    statusFilter === 'Up' ? item.value[1] === "1" : item.value[1] !== "1"
                );
            }

            setFilteredData(filtered);
        }
    }, [schoolFilter, regionFilter, statusFilter, tableData]);

    const uniqueRegions = [...new Set(tableData.map((item) => item.metric.region || `Region ${tableData.indexOf(item) + 1}`))];

    const lineChartData = etherData.length > 0 ? {
        labels: Array(etherData.length).fill().map((_, index) => `Time ${index + 1}`),
        datasets: [
            {
                label: 'Ether1 OutOctet Data',
                data: etherData,
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1,
            },
        ],
    } : null;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="w-full bg-white text-gray-800 p-2 flex justify-between items-center shadow-md">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="p-2 text-gray-800 focus:outline-none">
                        <span className="material-icons">
                            {isSidebarVisible ? 'menu_open' : 'menu'}
                        </span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex">
                {isSidebarVisible && (
         <aside className="w-64 bg-white text-gray-800 flex flex-col justify-between">
         <div className="p-4">
           <h1 className="text-2xl font-bold mb-6">Menu</h1>
           <nav>
             <ul className="space-y-4">
               <li>
                 <button
                   onClick={() => navigate('/dashboard')}
                   className="flex items-center text-gray-800 hover:text-gray-600"
                 >
                   <span className="material-icons">dashboard</span>
                   <span className="ml-3">Dashboard</span>
                 </button>
               </li>
               <li>
                 <button
                   onClick={() => navigate('/profile')}
                   className="flex items-center text-gray-800 hover:text-gray-600"
                 >
                   <span className="material-icons">person</span>
                   <span className="ml-3">Profile</span>
                 </button>
               </li>
               {role === 'admin' && (
                 <li>
                   <button
                     onClick={() => navigate('/admin')}
                     className="flex items-center text-gray-800 hover:text-gray-600"
                   >
                     <span className="material-icons">admin_panel_settings</span>
                     <span className="ml-3">Admin Panel</span>
                   </button>
                 </li>
               )}
             </ul>
           </nav>
         </div>

         <div className="p-4 border-t border-gray-200">
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center text-red-600 hover:text-red-400"
           >
             <span className="material-icons">logout</span>
             <span className="ml-3">Log Out</span>
           </button>
         </div>
       </aside>

                )}

                <main className="flex-1 p-6 bg-gray-100 flex flex-col gap-4">
                    <div className="flex gap-4">
                    <div className="grid grid-cols-2 gap-4 flex-1">
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center">
        <div className="w-1/3 flex justify-center">
            {/* Progress bar or circular chart */}
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="2"
                    ></circle>
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeDasharray="100,100"
                        strokeLinecap="round"
                    ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    100%
                </div>
            </div>
        </div>
        <div className="w-2/3 pl-4">
            <h3 className="text-sm font-semibold text-gray-500">Online devices</h3>
            <p className="text-lg font-bold text-gray-800">{onlineCount} / 5</p>
        </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center">
        <div className="w-1/3 flex justify-center">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="2"
                    ></circle>
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeDasharray="10,100"
                        strokeLinecap="round"
                    ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    10%
                </div>
            </div>
        </div>
        <div className="w-2/3 pl-4">
            <h3 className="text-sm font-semibold text-gray-500">Средняя утилизация</h3>
            <p className="text-lg font-bold text-gray-800">2 / 20</p>
        </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center">
        <div className="w-1/3 flex justify-center">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="2"
                    ></circle>
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeDasharray="10,100"
                        strokeLinecap="round"
                    ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    10%
                </div>
            </div>
        </div>
        <div className="w-2/3 pl-4">
            <h3 className="text-sm font-semibold text-gray-500">Диск</h3>
            <p className="text-lg font-bold text-gray-800">1 / 10</p>
        </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center">
        <div className="w-1/3 flex justify-center">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="2"
                    ></circle>
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeDasharray="0,100"
                        strokeLinecap="round"
                    ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    0%
                </div>
            </div>
        </div>
        <div className="w-2/3 pl-4">
            <h3 className="text-sm font-semibold text-gray-500">Плавающий IP</h3>
            <p className="text-lg font-bold text-gray-800">0 / 50</p>
        </div>
    </div>
</div>

                        <div className="flex-[1.7] bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500">Average Bandwidth Usage</h3>
        <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 border rounded-md text-gray-800"
        >
            <option value="5m">5 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="5h">5 hours</option>
            <option value="10h">10 hours</option>
            <option value="24h">24 hours</option>
            <option value="5d">5 days</option>
            <option value="10d">10 days</option>
        </select>
    </div>
    {lineChartData && <Line data={lineChartData} />}
</div>
                    </div>
                    {/* New Table Section */}
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow mt-4">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">List of objects</h3>
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Object</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Bandwidth</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Logs</th>
                                </tr>
                                <tr>
                                    <th className="text-left px-6 py-3">
                                        <input
                                            type="text"
                                            placeholder="Filter by object"
                                            value={schoolFilter}
                                            onChange={(e) => setSchoolFilter(e.target.value)}
                                            className="p-2 border rounded-md text-gray-800 w-full"
                                        />
                                    </th>
                                    <th className="text-left px-6 py-3">
                                        <select
                                            value={regionFilter}
                                            onChange={(e) => setRegionFilter(e.target.value)}
                                            className="p-2 border rounded-md text-gray-800 w-full"
                                        >
                                            <option value="">All regions</option>
                                            {uniqueRegions.map((region, index) => (
                                                <option key={index} value={region}>
                                                    {region}
                                                </option>
                                            ))}
                                        </select>
                                    </th>
                                    <th className="text-left px-6 py-3">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="p-2 border rounded-md text-gray-800 w-full"
                                        >
                                            <option value="">Filter by status</option>
                                            <option value="Up">Up</option>
                                            <option value="Down">Down</option>
                                        </select>
                                    </th>
                                    <th className="px-6 py-3"></th>
                                    <th className="px-6 py-3"></th>
                                    <th className="px-6 py-3"></th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.metric.instance} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">Object {index + 1}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.metric.region || `Region ${index + 1}`}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {item.value[1] === "1" ? (
                                                    <span className="flex items-center text-green-600">
                                                        <span className="material-icons mr-1">check_circle</span> Up
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600">
                                                        <span className="material-icons mr-1">cancel</span> Down
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">100 Mbps</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(item.metric.__name__ === 'up' ? parseInt(item.value[0]) * 1000 : Date.now()).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <button
                                                onClick={() => openLogsModal(item.metric.instance)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View Logs
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
            {isLogsModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Logs for {selectedDevice}</h3>
                        <pre className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto text-sm">
                            {logsContent}
                        </pre>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={closeLogsModal}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
