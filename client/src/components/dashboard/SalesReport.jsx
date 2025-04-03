import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#4B0082",
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    flex: 1,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  summaryText: {
    fontSize: 12,
    marginBottom: 5,
  },
  noData: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
  },
});

const SalesReport = ({ orders = [] }) => {
  // Early return if orders is undefined or empty
  if (!orders || orders.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Sales Report</Text>
          <Text style={styles.noData}>No orders available for this period</Text>
          <Text style={styles.footer}>
            Generated on {new Date().toLocaleString()}
          </Text>
        </Page>
      </Document>
    );
  }

  try {
    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const total = order.total || 0;
      return sum + parseFloat(total);
    }, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Count orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Sales Report</Text>

          <View style={styles.section}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Order ID</Text>
                <Text style={styles.tableCell}>Customer</Text>
                <Text style={styles.tableCell}>Status</Text>
                <Text style={styles.tableCell}>Total</Text>
                <Text style={styles.tableCell}>Date</Text>
              </View>

              {orders.map((order) => (
                <View key={order._id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{order.orderId || "N/A"}</Text>
                  <Text style={styles.tableCell}>
                    {order.customerInfo?.name || "N/A"}
                  </Text>
                  <Text style={styles.tableCell}>{order.status || "N/A"}</Text>
                  <Text style={styles.tableCell}>
                    ${(order.total || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total Orders: {totalOrders}</Text>
            <Text style={styles.summaryText}>
              Total Revenue: ${totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Average Order Value: ${averageOrderValue.toFixed(2)}
            </Text>

            <Text style={[styles.summaryText, { marginTop: 10 }]}>
              Orders by Status:
            </Text>
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <Text key={status} style={styles.summaryText}>
                {status}: {count}
              </Text>
            ))}
          </View>

          <Text style={styles.footer}>
            Generated on {new Date().toLocaleString()}
          </Text>
        </Page>
      </Document>
    );
  } catch (error) {
    console.error("Error generating sales report:", error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Sales Report</Text>
          <Text style={styles.noData}>Error generating report</Text>
          <Text style={styles.footer}>
            Generated on {new Date().toLocaleString()}
          </Text>
        </Page>
      </Document>
    );
  }
};

export default SalesReport;
