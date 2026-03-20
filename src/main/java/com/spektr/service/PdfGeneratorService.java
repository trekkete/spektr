package com.spektr.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.spektr.model.Vendor;
import com.spektr.model.Vendor.FileAttachment;
import com.spektr.model.VendorConfiguration;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class PdfGeneratorService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateVendorConfigurationPdf(VendorConfiguration config) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Add title
        Paragraph title = new Paragraph("Vendor Configuration Report")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        // Add metadata
        document.add(new Paragraph("Vendor: " + config.getVendorName()).setBold());
        document.add(new Paragraph("Version: " + config.getVersion()));
        document.add(new Paragraph("Owner: " + config.getOwner().getUsername()));
        document.add(new Paragraph("Created: " + DATE_FORMAT.format(config.getCreatedAt())));

        if (config.getDescription() != null && !config.getDescription().isEmpty()) {
            document.add(new Paragraph("Description: " + config.getDescription()));
        }

        document.add(new Paragraph("\n"));

        // Get the first revision (assuming single revision for now)
        Vendor vendorData = config.getVendorData();
        if (vendorData.getRevisions() != null && !vendorData.getRevisions().isEmpty()) {
            String firstKey = vendorData.getRevisions().keySet().iterator().next();
            Vendor.VendorIntegrationSnapshot snapshot = vendorData.getRevisions().get(firstKey);

            // Basic Info Section
            addSection(document, "Basic Information");
            addField(document, "Operator", snapshot.getOperator());
            addField(document, "Model", snapshot.getModel());
            addField(document, "Firmware Version", snapshot.getFirmwareVersion());
            addField(document, "Timestamp", DATE_FORMAT.format(Instant.ofEpochSecond(snapshot.getTimestamp()).atZone(ZoneId.systemDefault()).toLocalDateTime()));

            if (snapshot.getAttachments() != null && !snapshot.getAttachments().isEmpty()) {
                addAttachments(document, snapshot.getAttachments(), "Basic Info Attachments");
            }

            // Captive Portal Section
            if (snapshot.getCaptivePortal() != null) {
                Vendor.CaptivePortal cp = snapshot.getCaptivePortal();
                addSection(document, "Captive Portal Configuration");

                addField(document, "Redirection URL", cp.getRedirectionUrl());
                addField(document, "Login URL", cp.getLoginUrl());
                addField(document, "Logout URL", cp.getLogoutUrl());

                if (cp.getQueryStringParameters() != null && !cp.getQueryStringParameters().isEmpty()) {
                    document.add(new Paragraph("Query String Parameters:").setBold().setMarginTop(5));
                    Table table = createParameterTable(cp.getQueryStringParameters(), cp.getQueryStringMapping());
                    document.add(table);
                }

                addField(document, "Notes", cp.getNotes());

                if (cp.getAttachments() != null && !cp.getAttachments().isEmpty()) {
                    addAttachments(document, cp.getAttachments(), "Captive Portal Attachments");
                }
            }

            // RADIUS Section
            if (snapshot.getRadius() != null) {
                Vendor.Radius radius = snapshot.getRadius();
                addSection(document, "RADIUS Configuration");

                addField(document, "Access Request", radius.getAccessRequest());
                addField(document, "Accounting Start", radius.getAccountingStart());
                addField(document, "Accounting Update", radius.getAccountingUpdate());
                addField(document, "Accounting Stop", radius.getAccountingStop());

                if (radius.getAuthenticationMask() != null) {
                    document.add(new Paragraph("Password Authentication Methods (Mask: " + radius.getAuthenticationMask() + ")"));
                    document.add(new Paragraph(decodeAuthenticationMask(radius.getAuthenticationMask())).setMarginLeft(20));
                }

                if (radius.getSupportedAttributesMask() != null) {
                    document.add(new Paragraph("Supported RADIUS Attributes (Mask: " + radius.getSupportedAttributesMask() + ")"));
                    document.add(new Paragraph(decodeSupportedAttributesMask(radius.getSupportedAttributesMask())).setMarginLeft(20));
                }

                addField(document, "Packet Source", radius.getPacketSource());

                addBooleanField(document, "Support CoA", radius.getSupportCoa());
                addBooleanField(document, "Support MAC Authentication", radius.getSupportMacAuthentication());
                addField(document, "Roaming Behaviour", radius.getRoamingBehaviour());

                if (radius.getAuthAttributes() != null && !radius.getAuthAttributes().isEmpty()) {
                    document.add(new Paragraph("Authentication Attributes:").setBold().setMarginTop(5));
                    Table table = createSimpleTable(radius.getAuthAttributes());
                    document.add(table);
                }

                if (radius.getAcctAttributes() != null && !radius.getAcctAttributes().isEmpty()) {
                    document.add(new Paragraph("Accounting Attributes:").setBold().setMarginTop(5));
                    Table table = createSimpleTable(radius.getAcctAttributes());
                    document.add(table);
                }

                addField(document, "Notes", radius.getNotes());

                if (radius.getAttachments() != null && !radius.getAttachments().isEmpty()) {
                    addAttachments(document, radius.getAttachments(), "RADIUS Attachments");
                }
            }

            // Walled Garden Section
            if (snapshot.getWalledGarden() != null) {
                Vendor.WalledGarden wg = snapshot.getWalledGarden();
                addSection(document, "Walled Garden Configuration");

                if (wg.getMask() != null) {
                    document.add(new Paragraph("Filtering Type Mask: " + wg.getMask()));
                    document.add(new Paragraph(decodeMask(wg.getMask())).setMarginLeft(20));
                }

                addBooleanField(document, "Has Welcome Page", wg.getWelcomePage());
                addField(document, "Notes", wg.getNotes());

                if (wg.getAttachments() != null && !wg.getAttachments().isEmpty()) {
                    addAttachments(document, wg.getAttachments(), "Walled Garden Attachments");
                }
            }

            // Login Methods Section
            if (snapshot.getLoginMethods() != null) {
                Vendor.LoginMethods lm = snapshot.getLoginMethods();
                addSection(document, "Login Methods");

                addBooleanField(document, "Support HTTPS", lm.getSupportHttps());
                addBooleanField(document, "Support Logout", lm.getSupportLogout());
                addBooleanField(document, "Support Mail Surf", lm.getSupportMailSurf());
                addBooleanField(document, "Support SMS Surf", lm.getSupportSmsSurf());
                addBooleanField(document, "Support Social Login", lm.getSupportSocial());
                addField(document, "Notes", lm.getNotes());

                if (lm.getAttachments() != null && !lm.getAttachments().isEmpty()) {
                    addAttachments(document, lm.getAttachments(), "Login Methods Attachments");
                }
            }
        }

        // Add footer
        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Generated by Spektr - Captive Portal Configuration Management System")
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.GRAY));

        document.close();
        return baos.toByteArray();
    }

    private void addSection(Document document, String title) {
        document.add(new Paragraph("\n"));
        Paragraph section = new Paragraph(title)
                .setFontSize(14)
                .setBold()
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setPadding(5);
        document.add(section);
    }

    private void addField(Document document, String label, String value) {
        if (value != null && !value.isEmpty()) {
            Paragraph p = new Paragraph()
                    .add(new Text(label + ": ").setBold())
                    .add(value);
            document.add(p);
        }
    }

    private void addBooleanField(Document document, String label, Boolean value) {
        if (value != null) {
            Paragraph p = new Paragraph()
                    .add(new Text(label + ": ").setBold())
                    .add(value ? "Yes" : "No");
            document.add(p);
        }
    }

    private Table createSimpleTable(Map<String, String> data) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("Key").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Value").setBold()));

        for (Map.Entry<String, String> entry : data.entrySet()) {
            table.addCell(entry.getKey());
            table.addCell(entry.getValue());
        }

        return table;
    }

    private Table createParameterTable(Map<String, String> params, Map<String, String> mapping) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("Parameter Name").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Example Value").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Mapped To").setBold()));

        for (Map.Entry<String, String> entry : params.entrySet()) {
            table.addCell(entry.getKey());
            table.addCell(entry.getValue());
            String mappedValue = (mapping != null && mapping.containsKey(entry.getKey()))
                    ? mapping.get(entry.getKey())
                    : "-";
            table.addCell(mappedValue);
        }

        return table;
    }

    private void addAttachments(Document document, java.util.List<FileAttachment> attachments, String sectionTitle) {
        document.add(new Paragraph(sectionTitle + ":").setBold().setMarginTop(10));

        for (FileAttachment attachment : attachments) {
            try {
                // Add attachment info
                Paragraph attachInfo = new Paragraph()
                        .add(new Text("File: ").setBold())
                        .add(attachment.getFilename())
                        .add(" (")
                        .add(String.format("%.2f KB", attachment.getSize() / 1024.0))
                        .add(")");
                document.add(attachInfo);

                if (attachment.getDescription() != null && !attachment.getDescription().isEmpty()) {
                    document.add(new Paragraph("Description: " + attachment.getDescription()).setMarginLeft(20));
                }

                // If it's an image, try to embed it
                if (attachment.getContentType() != null && attachment.getContentType().startsWith("image/")) {
                    try {
                        byte[] imageBytes = Base64.getDecoder().decode(attachment.getContent());
                        Image image = new Image(ImageDataFactory.create(imageBytes));

                        // Scale image to fit page width (max 400 points)
                        if (image.getImageWidth() > 400) {
                            image.scaleToFit(400, 400);
                        }

                        document.add(image.setMarginLeft(20).setMarginTop(5).setMarginBottom(5));
                    } catch (Exception e) {
                        document.add(new Paragraph("[Image could not be embedded]").setMarginLeft(20).setItalic());
                    }
                }

                document.add(new Paragraph("\n"));
            } catch (Exception e) {
                // Skip problematic attachments
                document.add(new Paragraph("[Attachment " + attachment.getFilename() + " could not be processed]").setItalic());
            }
        }
    }

    private String decodeMask(int mask) {
        StringBuilder sb = new StringBuilder("Enabled options: ");
        boolean hasAny = false;

        if ((mask & 1) != 0) {
            sb.append("BY_IP");
            hasAny = true;
        }
        if ((mask & 2) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("BY_DOMAIN");
            hasAny = true;
        }
        if ((mask & 4) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("WITH_WILDCARD");
            hasAny = true;
        }
        if ((mask & 8) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("BY_PROTOCOL");
            hasAny = true;
        }
        if ((mask & 16) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("BY_PORT");
            hasAny = true;
        }

        if (!hasAny) {
            sb.append("None");
        }

        return sb.toString();
    }

    private String decodeAuthenticationMask(int mask) {
        StringBuilder sb = new StringBuilder("Enabled methods: ");
        boolean hasAny = false;

        if ((mask & 1) != 0) {
            sb.append("PAP (Password Authentication Protocol)");
            hasAny = true;
        }
        if ((mask & 2) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("CHAP (Challenge-Handshake Authentication Protocol)");
            hasAny = true;
        }
        if ((mask & 4) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("MS-CHAP v2 (Microsoft CHAP version 2)");
            hasAny = true;
        }

        if (!hasAny) {
            sb.append("None");
        }

        return sb.toString();
    }

    private String decodeSupportedAttributesMask(int mask) {
        StringBuilder sb = new StringBuilder("Supported attributes: ");
        boolean hasAny = false;

        if ((mask & 1) != 0) {
            sb.append("Session-Timeout");
            hasAny = true;
        }
        if ((mask & 2) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Idle-Timeout");
            hasAny = true;
        }
        if ((mask & 4) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Acct-Interim-Interval");
            hasAny = true;
        }
        if ((mask & 8) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Filter-Id");
            hasAny = true;
        }
        if ((mask & 16) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Upload Bandwidth Limit");
            hasAny = true;
        }
        if ((mask & 32) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Download Bandwidth Limit");
            hasAny = true;
        }
        if ((mask & 64) != 0) {
            if (hasAny) sb.append(", ");
            sb.append("Termination-Cause");
            hasAny = true;
        }

        if (!hasAny) {
            sb.append("None");
        }

        return sb.toString();
    }
}
