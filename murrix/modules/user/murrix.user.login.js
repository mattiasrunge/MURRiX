
function DbLoginInitEnterInformation(wizard, properties)
{
  var container = $("<div>" + $("#murrix-user-login-form").render({}) + "</div>");
  
  container.find("form").bind("submit", function(event)
  {
    event.preventDefault();
    wizard.Next();
  });

  wizard.Show(container);
}

function DbLoginValidateEnterInformation(wizard, properties)
{
  var username = "";
  var password = "";
  
  jQuery.each($(".popup-form-input"), function(n, element)
  {
    element = $(element);

    if (element.attr("name") == "username")
    {
      username = element.val();
    }
    else if (element.attr("name") == "password")
    {
      password = element.val();
    }
  });

  if ("" == username || "" == password)
  {
    return false;
  }


  properties["username"] = username;
  properties["password"] = password;

  return true;
}

function DbLoginInitLogin(wizard, properties)
{
  var in_node = { 
    "type" : "maillist_subscriber", 
    "name" : properties["name"],
    "attributes" : { 
      "Email" : properties["email"]
    }
  };
 
  murrix_modules["user"].Login(properties["username"], properties["password"], function(transaction_id, result_code, user_node_data)
  {
    if (MURRIX_RESULT_CODE_OK == result_code)
    {
      
      wizard.Show($("<div>" + $("#murrix-user-login-result").render(user_node_data) + "</div>"));
    }
    else
    {
      wizard.Show($("<div>" + $("#murrix-user-login-result").render({ "result_code" : result_code }) + "</div>"));
    }
  });  
}

$(function()
{
  murrix_wizards["user.login"] = new MurrixWizard([
    { "init" : DbLoginInitEnterInformation, "validate" : DbLoginValidateEnterInformation },
    { "init" : DbLoginInitLogin,            "validate" : null }
  ]);
})
